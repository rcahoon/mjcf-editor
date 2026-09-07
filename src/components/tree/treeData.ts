import type { ActuatorEntry, BodyNode, MjcfDocument, SensorEntry } from '../../core/mjcf/types'
import type { DeviceMapEntry } from '../../core/deviceMap/types'
import type { Selection } from '../../state/store'
import { findBody, findJoint, findSite } from '../../core/mjcf/queries'
import { resolveSensorKindForTarget } from '../../state/actions/sensorActions'
import { deviceRequiredTargetType } from '../../core/deviceMap/targetType'

export interface TreeItem {
  id: string
  label: string
  selection?: Selection
  children?: TreeItem[]
}

function targetKey(type: string, name: string): string {
  return `${type}:${name}`
}

function actuatorItem(a: ActuatorEntry): TreeItem {
  return {
    id: `actuator:${a.id}`,
    label: `▸ ${a.name ?? '(actuator)'} [${a.kind}]`,
    selection: { kind: 'actuator', id: a.id },
  }
}

function sensorItem(s: SensorEntry): TreeItem {
  return {
    id: `sensor:${s.id}`,
    label: `◈ ${s.name ?? '(sensor)'} [${s.kind}]`,
    selection: { kind: 'sensor', id: s.id },
  }
}

function deviceItem(d: DeviceMapEntry): TreeItem {
  const idPart = `${d.idSpace || '?'}.${Number.isNaN(d.deviceId) ? '?' : d.deviceId}`
  return {
    id: `device:${d.id}`,
    label: `▦ ${idPart} [${d.resolvedKind ?? '?'}]`,
    selection: { kind: 'device', id: d.id },
  }
}

interface TargetIndex {
  actuatorsByTarget: Map<string, ActuatorEntry[]>
  sensorsByTarget: Map<string, SensorEntry[]>
  devicesByTarget: Map<string, DeviceMapEntry[]>
  attachedActuatorIds: Set<string>
  attachedSensorIds: Set<string>
  attachedDeviceIds: Set<string>
}

function buildTargetIndex(doc: MjcfDocument): TargetIndex {
  const actuatorsByTarget = new Map<string, ActuatorEntry[]>()
  const sensorsByTarget = new Map<string, SensorEntry[]>()
  const devicesByTarget = new Map<string, DeviceMapEntry[]>()
  for (const a of doc.actuators) {
    if (!a.target.name) continue
    const key = targetKey(a.target.type, a.target.name)
    const list = actuatorsByTarget.get(key) ?? []
    list.push(a)
    actuatorsByTarget.set(key, list)
  }
  for (const s of doc.sensors) {
    if (!s.target.name) continue
    const key = targetKey(s.target.type, s.target.name)
    const list = sensorsByTarget.get(key) ?? []
    list.push(s)
    sensorsByTarget.set(key, list)
  }
  for (const d of doc.deviceMap) {
    const targetType = deviceRequiredTargetType(d.resolvedKind)
    const name = targetType === 'joint' ? d.joint : targetType === 'body' ? d.body : undefined
    if (!targetType || !name) continue
    const key = targetKey(targetType, name)
    const list = devicesByTarget.get(key) ?? []
    list.push(d)
    devicesByTarget.set(key, list)
  }
  return {
    actuatorsByTarget,
    sensorsByTarget,
    devicesByTarget,
    attachedActuatorIds: new Set(),
    attachedSensorIds: new Set(),
    attachedDeviceIds: new Set(),
  }
}

function jointChildrenFor(index: TargetIndex, name: string | undefined): TreeItem[] {
  if (!name) return []
  const key = targetKey('joint', name)
  const actuators = index.actuatorsByTarget.get(key) ?? []
  const sensors = index.sensorsByTarget.get(key) ?? []
  const devices = index.devicesByTarget.get(key) ?? []
  for (const a of actuators) index.attachedActuatorIds.add(a.id)
  for (const s of sensors) index.attachedSensorIds.add(s.id)
  for (const d of devices) index.attachedDeviceIds.add(d.id)
  return [...actuators.map(actuatorItem), ...sensors.map(sensorItem), ...devices.map(deviceItem)]
}

function siteChildrenFor(index: TargetIndex, name: string | undefined): TreeItem[] {
  if (!name) return []
  const key = targetKey('site', name)
  const sensors = index.sensorsByTarget.get(key) ?? []
  for (const s of sensors) index.attachedSensorIds.add(s.id)
  return sensors.map(sensorItem)
}

function bodyChildrenFor(index: TargetIndex, name: string | undefined): TreeItem[] {
  if (!name) return []
  const key = targetKey('body', name)
  const devices = index.devicesByTarget.get(key) ?? []
  for (const d of devices) index.attachedDeviceIds.add(d.id)
  return devices.map(deviceItem)
}

function bodyToItem(body: BodyNode, isRoot: boolean, index: TargetIndex): TreeItem {
  const children: TreeItem[] = []
  for (const j of body.joints) {
    children.push({
      id: `joint:${j.id}`,
      label: `⚙ ${j.name ?? '(joint)'} [${j.type}]`,
      selection: { kind: 'joint', id: j.id },
      children: jointChildrenFor(index, j.name),
    })
  }
  for (const g of body.geoms) {
    children.push({
      id: `geom:${g.id}`,
      label: `◆ ${g.name ?? '(geom)'} [${g.type}]`,
      selection: { kind: 'geom', id: g.id },
    })
  }
  for (const s of body.sites) {
    children.push({
      id: `site:${s.id}`,
      label: `● ${s.name ?? '(site)'}`,
      selection: { kind: 'site', id: s.id },
      children: siteChildrenFor(index, s.name),
    })
  }
  children.push(...bodyChildrenFor(index, isRoot ? undefined : body.name))
  for (const c of body.children) children.push(bodyToItem(c, false, index))

  return {
    id: `body:${body.id}`,
    label: isRoot ? 'worldbody' : (body.name ?? '(unnamed body)'),
    selection: isRoot ? undefined : { kind: 'body', id: body.id },
    children,
  }
}

export function buildTreeData(doc: MjcfDocument): TreeItem[] {
  const index = buildTargetIndex(doc)
  const worldItem = bodyToItem(doc.worldbody, true, index)

  const unresolvedActuators = doc.actuators.filter((a) => !index.attachedActuatorIds.has(a.id))
  const unresolvedSensors = doc.sensors.filter((s) => !index.attachedSensorIds.has(s.id))
  const unresolvedDevices = doc.deviceMap.filter((d) => !index.attachedDeviceIds.has(d.id))
  const unresolvedCount = unresolvedActuators.length + unresolvedSensors.length + unresolvedDevices.length

  const items = [worldItem]
  if (unresolvedCount > 0) {
    items.push({
      id: 'section:unresolved',
      label: `⚠ Unresolved (${unresolvedCount})`,
      children: [
        ...unresolvedActuators.map(actuatorItem),
        ...unresolvedSensors.map(sensorItem),
        ...unresolvedDevices.map(deviceItem),
      ],
    })
  }
  return items
}

export type DropCompatibility = 'valid' | 'invalid' | 'irrelevant'

/**
 * Whether dragging `dragSelection` (an actuator/sensor/device tree row)
 * onto `targetSelection` (the row being dropped on) should retarget it.
 * 'irrelevant' means this pair isn't a drag this feature handles at all
 * (e.g. dropping onto a geom) — callers treat that like 'invalid' for
 * disableDrop purposes, but keep it distinct so the tree renderer doesn't
 * paint unrelated rows with reject styling.
 */
export function checkTreeDrop(
  doc: MjcfDocument,
  dragSelection: Selection | undefined,
  targetSelection: Selection | undefined,
): DropCompatibility {
  if (!dragSelection || !targetSelection) return 'irrelevant'
  if (dragSelection.kind !== 'actuator' && dragSelection.kind !== 'sensor' && dragSelection.kind !== 'device') {
    return 'irrelevant'
  }

  if (dragSelection.kind === 'device') {
    if (targetSelection.kind !== 'joint' && targetSelection.kind !== 'body') return 'irrelevant'
    const targetName =
      targetSelection.kind === 'joint'
        ? findJoint(doc.worldbody, targetSelection.id)?.name
        : findBody(doc.worldbody, targetSelection.id)?.name
    if (!targetName) return 'invalid'
    const device = doc.deviceMap.find((d) => d.id === dragSelection.id)
    if (!device) return 'invalid'
    // No kind auto-conversion for devices (unlike sensors' 3 pairs) — motor/
    // encoder and imu/pose share no physical equivalence, so a device is
    // only ever a valid drop where its *current* resolved kind already fits.
    return deviceRequiredTargetType(device.resolvedKind) === targetSelection.kind ? 'valid' : 'invalid'
  }

  if (targetSelection.kind !== 'joint' && targetSelection.kind !== 'site') return 'irrelevant'
  const targetName =
    targetSelection.kind === 'joint'
      ? findJoint(doc.worldbody, targetSelection.id)?.name
      : findSite(doc.worldbody, targetSelection.id)?.name
  if (!targetName) return 'invalid'

  if (dragSelection.kind === 'actuator') return 'valid'

  const sensor = doc.sensors.find((s) => s.id === dragSelection.id)
  if (!sensor) return 'invalid'
  return resolveSensorKindForTarget(sensor.kind, targetSelection.kind) ? 'valid' : 'invalid'
}
