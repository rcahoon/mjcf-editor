import type { NodeId } from '../xml/xmlNode'
import type { BodyNode, MjcfDocument } from './types'

export interface ValidationIssue {
  severity: 'error' | 'warning'
  message: string
  nodeId?: NodeId
}

function addName(map: Map<string, NodeId[]>, name: string, id: NodeId): void {
  const arr = map.get(name) ?? []
  arr.push(id)
  map.set(name, arr)
}

/** Collects MJCF names by their per-type flat namespace and checks for
 * duplicates and dangling actuator/sensor references. */
export function validateMjcfDocument(doc: MjcfDocument): ValidationIssue[] {
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
      issues.push({ severity: 'warning', message: `Actuator "${label}" has no target`, nodeId: a.id })
    } else if (!pool.has(a.target.name)) {
      issues.push({
        severity: 'error',
        message: `Actuator "${label}" references unknown ${a.target.type} "${a.target.name}"`,
        nodeId: a.id,
      })
    }
  }

  for (const s of doc.sensors) {
    const pool = s.target.type === 'joint' ? jointNames : siteNames
    const label = s.name ?? `sensor ${s.id}`
    if (!s.target.name) {
      issues.push({ severity: 'warning', message: `Sensor "${label}" has no target`, nodeId: s.id })
    } else if (!pool.has(s.target.name)) {
      issues.push({
        severity: 'error',
        message: `Sensor "${label}" references unknown ${s.target.type} "${s.target.name}"`,
        nodeId: s.id,
      })
    }
  }

  return issues
}
