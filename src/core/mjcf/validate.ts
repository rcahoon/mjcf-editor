import type { NodeId } from '../xml/xmlNode'
import { getAttr } from './attrUtils'
import { getDeviceAttr } from '../deviceMap/attrs'
import { getIdSpaceInfo, isDeviceKind, isKnownIdSpace, isKnownMotor } from '../deviceMap/idSpaces'
import { findKeyframeSection } from './keyframes'
import type { DeviceMapEntry } from '../deviceMap/types'
import type { BodyNode, MjcfDocument } from './types'

/** Duplicated (not imported) from state/store.ts's SelectionKind so this
 * stays framework/state-agnostic and testable in plain Vitest — the two
 * happen to share the same members. */
export type EntityKind = 'body' | 'joint' | 'geom' | 'site' | 'actuator' | 'sensor' | 'device'

export interface ValidationIssue {
  severity: 'error' | 'warning'
  message: string
  nodeId?: NodeId
  nodeKind?: EntityKind
}

export interface ValidateOptions {
  /** The robot's control period in seconds (spec §7.1) — an editor-only
   * setting, not part of the MJCF file. Defaults to Team 766's 0.005s. */
  controlPeriod?: number
}

function addName(map: Map<string, NodeId[]>, name: string, id: NodeId): void {
  const arr = map.get(name) ?? []
  arr.push(id)
  map.set(name, arr)
}

function splitDeviceName(rawName: string): string[] {
  const afterPrefix = rawName.startsWith('dev.') ? rawName.slice(4) : rawName
  return afterPrefix.split('.')
}

function validateDeviceMap(
  doc: MjcfDocument,
  issues: ValidationIssue[],
  jointNames: Map<string, NodeId[]>,
  bodyNames: Map<string, NodeId[]>,
): void {
  const byIdentity = new Map<string, DeviceMapEntry[]>()

  for (const entry of doc.deviceMap) {
    const label = `${entry.idSpace || '?'}.${Number.isNaN(entry.deviceId) ? '?' : entry.deviceId}`
    const rawName = getAttr(entry.xml, 'name') ?? ''
    const idSpaceInfo = getIdSpaceInfo(entry.idSpace)

    // --- Naming (rules 1-4) ---
    if (splitDeviceName(rawName).length !== 2) {
      issues.push({
        severity: 'error',
        message: `Device "${rawName}" must have exactly two dot-separated parts after "dev."`,
        nodeId: entry.id,
        nodeKind: 'device',
      })
    }
    if (!isKnownIdSpace(entry.idSpace)) {
      issues.push({
        severity: 'error',
        message: `Device "${label}" has an unknown ID space "${entry.idSpace}"`,
        nodeId: entry.id,
        nodeKind: 'device',
      })
    }
    if (Number.isNaN(entry.deviceId)) {
      issues.push({
        severity: 'error',
        message: `Device "${label}" has a device ID that isn't an integer`,
        nodeId: entry.id,
        nodeKind: 'device',
      })
    } else if (entry.deviceId < 0) {
      issues.push({
        severity: 'warning',
        message: `Device "${label}" has a negative device ID, which is meaningless downstream`,
        nodeId: entry.id,
        nodeKind: 'device',
      })
    } else {
      const identityKey = `${entry.idSpace}:${entry.deviceId}`
      const list = byIdentity.get(identityKey) ?? []
      list.push(entry)
      byIdentity.set(identityKey, list)
    }

    // --- Data (rules 5-10) ---
    for (const token of entry.malformedTokens) {
      issues.push({
        severity: 'error',
        message: `Device "${label}" has a malformed data token "${token}" (missing "=")`,
        nodeId: entry.id,
        nodeKind: 'device',
      })
    }
    for (const key of ['gear', 'efficiency', 'ticksPerRevolution', 'currentLimit'] as const) {
      const raw = getDeviceAttr(entry.dataPairs, key)
      if (raw !== undefined && Number.isNaN(Number(raw))) {
        issues.push({
          severity: 'error',
          message: `Device "${label}"'s ${key}="${raw}" isn't a number`,
          nodeId: entry.id,
          nodeKind: 'device',
        })
      }
    }
    const rawKind = getDeviceAttr(entry.dataPairs, 'kind')
    if (rawKind !== undefined && !isDeviceKind(rawKind)) {
      issues.push({
        severity: 'error',
        message: `Device "${label}" has an unknown kind "${rawKind}"`,
        nodeId: entry.id,
        nodeKind: 'device',
      })
    }
    if (idSpaceInfo && idSpaceInfo.defaultKind === null && rawKind === undefined) {
      issues.push({
        severity: 'error',
        message: `Device "${label}": ${entry.idSpace} has no default kind — an explicit kind is required`,
        nodeId: entry.id,
        nodeKind: 'device',
      })
    }
    if (idSpaceInfo?.defaultKind && entry.explicitKind && entry.explicitKind !== idSpaceInfo.defaultKind) {
      issues.push({
        severity: 'warning',
        message: `Device "${label}" overrides ${entry.idSpace}'s default kind (${idSpaceInfo.defaultKind}) with "${entry.explicitKind}" — the robot code type-checks the sensor message it receives for this ID space`,
        nodeId: entry.id,
        nodeKind: 'device',
      })
    }
    if (entry.resolvedKind === 'motor') {
      const motorName = entry.motor ?? 'KrakenX60'
      if (!isKnownMotor(motorName)) {
        issues.push({
          severity: 'error',
          message: `Device "${label}" names an unknown motor "${motorName}"`,
          nodeId: entry.id,
          nodeKind: 'device',
        })
      }
    }

    // --- Required fields + cross-references (rules 6, 11-15) ---
    if (entry.resolvedKind === 'motor' || entry.resolvedKind === 'encoder') {
      if (!entry.joint) {
        issues.push({
          severity: 'error',
          message: `Device "${label}" (${entry.resolvedKind}) requires a joint`,
          nodeId: entry.id,
          nodeKind: 'device',
        })
      } else if (!jointNames.has(entry.joint)) {
        issues.push({
          severity: 'error',
          message: `Device "${label}" references unknown joint "${entry.joint}"`,
          nodeId: entry.id,
          nodeKind: 'device',
        })
      }
    }
    if (entry.resolvedKind === 'imu' || entry.resolvedKind === 'pose') {
      if (!entry.body) {
        issues.push({
          severity: 'error',
          message: `Device "${label}" (${entry.resolvedKind}) requires a body`,
          nodeId: entry.id,
          nodeKind: 'device',
        })
      } else if (!bodyNames.has(entry.body)) {
        issues.push({
          severity: 'error',
          message: `Device "${label}" references unknown body "${entry.body}"`,
          nodeId: entry.id,
          nodeKind: 'device',
        })
      }
    }

    if (entry.resolvedKind === 'motor' && entry.joint && jointNames.has(entry.joint)) {
      if (entry.actuator) {
        const actuator = doc.actuators.find((a) => a.name === entry.actuator)
        if (!actuator) {
          issues.push({
            severity: 'error',
            message: `Device "${label}" references unknown actuator "${entry.actuator}"`,
            nodeId: entry.id,
            nodeKind: 'device',
          })
        } else if (actuator.gear === 0) {
          issues.push({
            severity: 'error',
            message: `Device "${label}"'s actuator "${entry.actuator}" has gear="0", which the simulation divides by`,
            nodeId: entry.id,
            nodeKind: 'device',
          })
        }
      } else {
        const matches = doc.actuators.filter((a) => a.target.type === 'joint' && a.target.name === entry.joint)
        if (matches.length === 0) {
          issues.push({
            severity: 'error',
            message: `Device "${label}": no actuator targets joint "${entry.joint}" — add one or set "actuator" explicitly`,
            nodeId: entry.id,
            nodeKind: 'device',
          })
        } else if (matches.length > 1) {
          issues.push({
            severity: 'error',
            message: `Device "${label}": ${matches.length} actuators target joint "${entry.joint}" — set "actuator" explicitly`,
            nodeId: entry.id,
            nodeKind: 'device',
          })
        } else if (matches[0].gear === 0) {
          issues.push({
            severity: 'error',
            message: `Device "${label}"'s auto-resolved actuator "${matches[0].name}" has gear="0", which the simulation divides by`,
            nodeId: entry.id,
            nodeKind: 'device',
          })
        }
      }
    }
  }

  for (const [key, entries] of byIdentity) {
    if (entries.length > 1) {
      issues.push({
        severity: 'error',
        message: `Duplicate device identity "${key}" (${entries.length} entries)`,
        nodeId: entries[0].id,
        nodeKind: 'device',
      })
    }
  }
}

function validateModelLevel(doc: MjcfDocument, issues: ValidationIssue[], controlPeriod: number): void {
  const timestep = doc.option.timestep
  if (timestep === undefined) {
    issues.push({
      severity: 'warning',
      message: `No <option timestep> set — the simulation needs one that evenly divides the ${controlPeriod}s control period`,
    })
  } else if (timestep <= 0) {
    issues.push({ severity: 'error', message: 'Timestep must be positive' })
  } else {
    const ratio = controlPeriod / timestep
    const rounded = Math.round(ratio)
    if (rounded < 1 || Math.abs(ratio - rounded) > 1e-6) {
      issues.push({
        severity: 'error',
        message: `Timestep ${timestep}s does not evenly divide the ${controlPeriod}s control period`,
      })
    }
  }

  if (!findKeyframeSection(doc)) {
    issues.push({
      severity: 'warning',
      message: 'No <keyframe> defined — the simulation falls back to a zero state, which usually interpenetrates the floor',
    })
  }
}

/** Collects MJCF names by their per-type flat namespace and checks for
 * duplicates and dangling actuator/sensor/device references, plus the
 * Team 766 device map's own grammar (spec §8) and model-level requirements
 * (spec §7). */
export function validateMjcfDocument(doc: MjcfDocument, options: ValidateOptions = {}): ValidationIssue[] {
  const controlPeriod = options.controlPeriod ?? 0.005
  const issues: ValidationIssue[] = []
  const jointNames = new Map<string, NodeId[]>()
  const siteNames = new Map<string, NodeId[]>()
  const bodyNames = new Map<string, NodeId[]>()

  function walk(body: BodyNode): void {
    if (body.name) addName(bodyNames, body.name, body.id)
    for (const j of body.joints) if (j.name) addName(jointNames, j.name, j.id)
    for (const s of body.sites) if (s.name) addName(siteNames, s.name, s.id)
    for (const c of body.children) walk(c)
  }
  walk(doc.worldbody)

  for (const [name, ids] of jointNames) {
    if (ids.length > 1) issues.push({ severity: 'error', message: `Duplicate joint name "${name}"` })
  }
  for (const [name, ids] of siteNames) {
    if (ids.length > 1) issues.push({ severity: 'error', message: `Duplicate site name "${name}"` })
  }
  for (const [name, ids] of bodyNames) {
    if (ids.length > 1) issues.push({ severity: 'error', message: `Duplicate body name "${name}"` })
  }

  for (const a of doc.actuators) {
    const pool = a.target.type === 'joint' ? jointNames : siteNames
    const label = a.name ?? `actuator ${a.id}`
    if (!a.target.name) {
      issues.push({ severity: 'warning', message: `Actuator "${label}" has no target`, nodeId: a.id, nodeKind: 'actuator' })
    } else if (!pool.has(a.target.name)) {
      issues.push({
        severity: 'error',
        message: `Actuator "${label}" references unknown ${a.target.type} "${a.target.name}"`,
        nodeId: a.id,
        nodeKind: 'actuator',
      })
    }
  }

  for (const s of doc.sensors) {
    const pool = s.target.type === 'joint' ? jointNames : siteNames
    const label = s.name ?? `sensor ${s.id}`
    if (!s.target.name) {
      issues.push({ severity: 'warning', message: `Sensor "${label}" has no target`, nodeId: s.id, nodeKind: 'sensor' })
    } else if (!pool.has(s.target.name)) {
      issues.push({
        severity: 'error',
        message: `Sensor "${label}" references unknown ${s.target.type} "${s.target.name}"`,
        nodeId: s.id,
        nodeKind: 'sensor',
      })
    }
  }

  validateDeviceMap(doc, issues, jointNames, bodyNames)
  validateModelLevel(doc, issues, controlPeriod)

  return issues
}
