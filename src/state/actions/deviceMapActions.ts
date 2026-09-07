import { setAttr } from '../../core/mjcf/attrUtils'
import { formatDeviceData, setDeviceAttr } from '../../core/deviceMap/attrs'
import { parseDeviceMapEntry } from '../../core/deviceMap/parse'
import { getIdSpaceInfo } from '../../core/deviceMap/idSpaces'
import { deviceRequiredTargetType } from '../../core/deviceMap/targetType'
import { elementNode, type NodeId } from '../../core/xml/xmlNode'
import type { DeviceKind, DeviceMapEntry } from '../../core/deviceMap/types'
import type { MjcfDocument } from '../../core/mjcf/types'

function writeDataAttr(entry: DeviceMapEntry): void {
  setAttr(entry.xml, 'data', formatDeviceData(entry.dataPairs))
}

/** After a kind-affecting change, drop whichever of joint/body no longer
 * applies so the entry doesn't carry a stale, contradictory reference —
 * it simply becomes unresolved (needs a fresh drag-to-target) instead. */
function reconcileTargetFields(entry: DeviceMapEntry): void {
  const required = deviceRequiredTargetType(entry.resolvedKind)
  if (required === 'joint' && entry.body !== undefined) {
    entry.body = undefined
    setDeviceAttr(entry.dataPairs, 'body', undefined)
  }
  if (required === 'body' && entry.joint !== undefined) {
    entry.joint = undefined
    setDeviceAttr(entry.dataPairs, 'joint', undefined)
  }
}

function recomputeResolvedKind(entry: DeviceMapEntry): void {
  entry.resolvedKind = entry.explicitKind ?? getIdSpaceInfo(entry.idSpace)?.defaultKind ?? undefined
  reconcileTargetFields(entry)
}

export function setDeviceIdentity(
  doc: MjcfDocument,
  entryId: NodeId,
  identity: { idSpace: string; deviceId: number },
): void {
  const entry = doc.deviceMap.find((d) => d.id === entryId)
  if (!entry) return
  entry.idSpace = identity.idSpace
  entry.deviceId = identity.deviceId
  setAttr(entry.xml, 'name', `dev.${identity.idSpace}.${identity.deviceId}`)
  recomputeResolvedKind(entry)
  writeDataAttr(entry)
}

/** `undefined` explicitly means "use the idSpace's default kind" — this
 * setter's one parameter can carry that meaning unambiguously, unlike a
 * multi-field patch where `undefined` would be indistinguishable from "not
 * touched" (the convention every other action module in this app uses). */
export function setDeviceExplicitKind(doc: MjcfDocument, entryId: NodeId, kind: DeviceKind | undefined): void {
  const entry = doc.deviceMap.find((d) => d.id === entryId)
  if (!entry) return
  entry.explicitKind = kind
  setDeviceAttr(entry.dataPairs, 'kind', kind)
  recomputeResolvedKind(entry)
  writeDataAttr(entry)
}

export type DeviceFieldPatch = Partial<
  Pick<DeviceMapEntry, 'gear' | 'motor' | 'currentLimit' | 'efficiency' | 'actuator' | 'ticksPerRevolution'>
>

export function setDeviceField(doc: MjcfDocument, entryId: NodeId, patch: DeviceFieldPatch): void {
  const entry = doc.deviceMap.find((d) => d.id === entryId)
  if (!entry) return
  if (patch.gear !== undefined) {
    entry.gear = patch.gear
    setDeviceAttr(entry.dataPairs, 'gear', String(patch.gear))
  }
  if (patch.motor !== undefined) {
    entry.motor = patch.motor
    setDeviceAttr(entry.dataPairs, 'motor', patch.motor)
  }
  if (patch.currentLimit !== undefined) {
    entry.currentLimit = patch.currentLimit
    setDeviceAttr(entry.dataPairs, 'currentLimit', String(patch.currentLimit))
  }
  if (patch.efficiency !== undefined) {
    entry.efficiency = patch.efficiency
    setDeviceAttr(entry.dataPairs, 'efficiency', String(patch.efficiency))
  }
  if (patch.actuator !== undefined) {
    entry.actuator = patch.actuator || undefined
    setDeviceAttr(entry.dataPairs, 'actuator', entry.actuator)
  }
  if (patch.ticksPerRevolution !== undefined) {
    entry.ticksPerRevolution = patch.ticksPerRevolution
    setDeviceAttr(entry.dataPairs, 'ticksPerRevolution', String(patch.ticksPerRevolution))
  }
  writeDataAttr(entry)
}

/** Used by tree drag: retargets onto a joint or body. Does not change kind
 * — `checkTreeDrop` only allows this when the entry's current resolved kind
 * is already compatible with the drop target's type. */
export function setDeviceTarget(
  doc: MjcfDocument,
  entryId: NodeId,
  target: { type: 'joint' | 'body'; name: string },
): void {
  const entry = doc.deviceMap.find((d) => d.id === entryId)
  if (!entry) return
  if (target.type === 'joint') {
    entry.joint = target.name
    entry.body = undefined
    setDeviceAttr(entry.dataPairs, 'joint', target.name)
    setDeviceAttr(entry.dataPairs, 'body', undefined)
  } else {
    entry.body = target.name
    entry.joint = undefined
    setDeviceAttr(entry.dataPairs, 'body', target.name)
    setDeviceAttr(entry.dataPairs, 'joint', undefined)
  }
  writeDataAttr(entry)
}

/** Creates a new device entry attached to `target`, in `idSpace`, with an
 * auto-suggested next-free device id (max existing in that idSpace + 1, or 0). */
export function addDevice(doc: MjcfDocument, idSpace: string, target: { type: 'joint' | 'body'; name: string }): NodeId {
  const existingIds = doc.deviceMap
    .filter((d) => d.idSpace === idSpace)
    .map((d) => d.deviceId)
    .filter((n) => !Number.isNaN(n))
  const deviceId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 0

  const xml = elementNode('text', {
    name: `dev.${idSpace}.${deviceId}`,
    data: formatDeviceData([{ key: target.type, value: target.name }]),
  })
  const entry = parseDeviceMapEntry(xml)
  doc.deviceMap.push(entry)
  doc.customSection.children.push(xml)
  return entry.id
}

export function clearDeviceCurrentLimit(doc: MjcfDocument, entryId: NodeId): void {
  const entry = doc.deviceMap.find((d) => d.id === entryId)
  if (!entry) return
  entry.currentLimit = undefined
  setDeviceAttr(entry.dataPairs, 'currentLimit', undefined)
  writeDataAttr(entry)
}

export function deleteDevice(doc: MjcfDocument, entryId: NodeId): void {
  const entry = doc.deviceMap.find((d) => d.id === entryId)
  if (!entry) return
  doc.deviceMap = doc.deviceMap.filter((d) => d.id !== entryId)
  doc.customSection.children = doc.customSection.children.filter((c) => c.id !== entry.xml.id)
}
