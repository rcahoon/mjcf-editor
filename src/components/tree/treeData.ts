import type { ActuatorEntry, BodyNode, MjcfDocument, SensorEntry } from '../../core/mjcf/types'
import type { Selection } from '../../state/store'
import { findJoint, findSite } from '../../core/mjcf/queries'
import { resolveSensorKindForTarget } from '../../state/actions/sensorActions'

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

interface TargetIndex {
  actuatorsByTarget: Map<string, ActuatorEntry[]>
  sensorsByTarget: Map<string, SensorEntry[]>
  attachedActuatorIds: Set<string>
  attachedSensorIds: Set<string>
}

function buildTargetIndex(doc: MjcfDocument): TargetIndex {
  const actuatorsByTarget = new Map<string, ActuatorEntry[]>()
  const sensorsByTarget = new Map<string, SensorEntry[]>()
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
  return {
    actuatorsByTarget,
    sensorsByTarget,
    attachedActuatorIds: new Set(),
    attachedSensorIds: new Set(),
  }
}

function attachedChildrenFor(index: TargetIndex, type: 'joint' | 'site', name: string | undefined): TreeItem[] {
  if (!name) return []
  const key = targetKey(type, name)
  const actuators = index.actuatorsByTarget.get(key) ?? []
  const sensors = index.sensorsByTarget.get(key) ?? []
  for (const a of actuators) index.attachedActuatorIds.add(a.id)
  for (const s of sensors) index.attachedSensorIds.add(s.id)
  return [...actuators.map(actuatorItem), ...sensors.map(sensorItem)]
}

function bodyToItem(body: BodyNode, isRoot: boolean, index: TargetIndex): TreeItem {
  const children: TreeItem[] = []
  for (const j of body.joints) {
    children.push({
      id: `joint:${j.id}`,
      label: `⚙ ${j.name ?? '(joint)'} [${j.type}]`,
      selection: { kind: 'joint', id: j.id },
      children: attachedChildrenFor(index, 'joint', j.name),
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
      children: attachedChildrenFor(index, 'site', s.name),
    })
  }
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
  const unresolvedCount = unresolvedActuators.length + unresolvedSensors.length

  const items = [worldItem]
  if (unresolvedCount > 0) {
    items.push({
      id: 'section:unresolved',
      label: `⚠ Unresolved (${unresolvedCount})`,
      children: [...unresolvedActuators.map(actuatorItem), ...unresolvedSensors.map(sensorItem)],
    })
  }
  return items
}

export type DropCompatibility = 'valid' | 'invalid' | 'irrelevant'

/**
 * Whether dragging `dragSelection` (an actuator/sensor tree row) onto
 * `targetSelection` (the row being dropped on) should retarget it.
 * 'irrelevant' means this pair isn't an actuator/sensor-onto-joint/site drag
 * at all (e.g. dropping onto a body or geom) — callers treat that like
 * 'invalid' for disableDrop purposes, but keep it distinct so the tree
 * renderer doesn't paint unrelated rows with reject styling.
 */
export function checkActuatorSensorDrop(
  doc: MjcfDocument,
  dragSelection: Selection | undefined,
  targetSelection: Selection | undefined,
): DropCompatibility {
  if (!dragSelection || (dragSelection.kind !== 'actuator' && dragSelection.kind !== 'sensor')) return 'irrelevant'
  if (!targetSelection || (targetSelection.kind !== 'joint' && targetSelection.kind !== 'site')) return 'irrelevant'

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
