import { setAttr } from '../../core/mjcf/attrUtils'
import { parseSensor } from '../../core/mjcf/parseMjcf'
import { getOrCreateTopSection } from '../../core/mjcf/sections'
import { elementNode, type NodeId } from '../../core/xml/xmlNode'
import type { MjcfDocument, SensorEntry, SensorKind } from '../../core/mjcf/types'

export const JOINT_ONLY_SENSOR_KINDS: SensorKind[] = ['jointpos', 'jointvel', 'jointactuatorfrc']
export const SITE_ONLY_SENSOR_KINDS: SensorKind[] = [
  'accelerometer',
  'gyro',
  'framepos',
  'framequat',
  'velocimeter',
  'force',
  'torque',
]

/** The only sensor kinds with a sensible equivalent on the other target
 * type — everything else has no counterpart and a drag across the
 * joint/site boundary must be rejected rather than guessed. */
const SENSOR_KIND_CONVERSION: Partial<Record<SensorKind, SensorKind>> = {
  jointpos: 'framepos',
  framepos: 'jointpos',
  jointvel: 'velocimeter',
  velocimeter: 'jointvel',
  jointactuatorfrc: 'force',
  force: 'jointactuatorfrc',
}

export function canSensorTarget(kind: SensorKind, targetType: 'joint' | 'site'): boolean {
  return targetType === 'joint' ? JOINT_ONLY_SENSOR_KINDS.includes(kind) : SITE_ONLY_SENSOR_KINDS.includes(kind)
}

/** Returns the kind this sensor should have for `targetType` — itself if
 * already compatible, its converted counterpart if one exists, or
 * `undefined` if there's no sensible equivalent (caller must reject). */
export function resolveSensorKindForTarget(kind: SensorKind, targetType: 'joint' | 'site'): SensorKind | undefined {
  if (canSensorTarget(kind, targetType)) return kind
  const converted = SENSOR_KIND_CONVERSION[kind]
  if (converted && canSensorTarget(converted, targetType)) return converted
  return undefined
}

function buildSensorTargetAttrs(kind: SensorKind, targetName: string | undefined): Record<string, string> {
  const attrs: Record<string, string> = {}
  if (!targetName) return attrs
  if (kind === 'jointpos' || kind === 'jointvel' || kind === 'jointactuatorfrc') {
    attrs.joint = targetName
  } else if (kind === 'framepos' || kind === 'framequat') {
    attrs.objtype = 'site'
    attrs.objname = targetName
  } else {
    attrs.site = targetName
  }
  return attrs
}

export function setSensorName(doc: MjcfDocument, sensorId: NodeId, name: string): void {
  const sensor = doc.sensors.find((s) => s.id === sensorId)
  if (!sensor) return
  sensor.name = name.trim() || undefined
  setAttr(sensor.xml, 'name', sensor.name)
}

export function setSensorTarget(doc: MjcfDocument, sensorId: NodeId, target: SensorEntry['target']): void {
  const sensor = doc.sensors.find((s) => s.id === sensorId)
  if (!sensor) return
  sensor.target = target
  if (sensor.kind === 'framepos' || sensor.kind === 'framequat') {
    setAttr(sensor.xml, 'objtype', 'site')
    setAttr(sensor.xml, 'objname', target.name)
  } else if (sensor.kind === 'jointpos' || sensor.kind === 'jointvel' || sensor.kind === 'jointactuatorfrc') {
    setAttr(sensor.xml, 'joint', target.name)
  } else {
    setAttr(sensor.xml, 'site', target.name)
  }
}

export function addSensor(doc: MjcfDocument, kind: SensorKind, targetName?: string): NodeId {
  const xml = elementNode(kind, buildSensorTargetAttrs(kind, targetName))
  const sensor = parseSensor(xml)
  doc.sensors.push(sensor)
  getOrCreateTopSection(doc, 'sensor').children.push(xml)
  return sensor.id
}

export function deleteSensor(doc: MjcfDocument, sensorId: NodeId): void {
  const sensor = doc.sensors.find((s) => s.id === sensorId)
  if (!sensor) return
  doc.sensors = doc.sensors.filter((s) => s.id !== sensorId)
  const section = getOrCreateTopSection(doc, 'sensor')
  section.children = section.children.filter((c) => c.id !== sensor.xml.id)
}

/**
 * Retargets a sensor by tree-drag rather than a property-panel dropdown.
 * When the sensor's current kind is already valid for `newTarget.type`,
 * this is just `setSensorTarget`. When it isn't (e.g. a jointpos sensor
 * dropped onto a site), it converts to the equivalent kind — which means a
 * new backing XML element (kind is the tag name, not an attribute), hence a
 * new sensor id. Returns the sensor's id going forward, or `undefined` if
 * there's no valid kind for this target (caller must reject the drop).
 */
export function moveSensorToTarget(
  doc: MjcfDocument,
  sensorId: NodeId,
  newTarget: SensorEntry['target'],
): NodeId | undefined {
  const sensor = doc.sensors.find((s) => s.id === sensorId)
  if (!sensor) return undefined
  const newKind = resolveSensorKindForTarget(sensor.kind, newTarget.type)
  if (!newKind) return undefined

  if (newKind === sensor.kind) {
    setSensorTarget(doc, sensorId, newTarget)
    return sensorId
  }

  const attrs = buildSensorTargetAttrs(newKind, newTarget.name)
  if (sensor.name) attrs.name = sensor.name
  const newXml = elementNode(newKind, attrs)
  const newSensor = parseSensor(newXml)

  const sensorIndex = doc.sensors.findIndex((s) => s.id === sensorId)
  doc.sensors[sensorIndex] = newSensor

  const section = getOrCreateTopSection(doc, 'sensor')
  const xmlIndex = section.children.findIndex((c) => c.id === sensor.xml.id)
  if (xmlIndex >= 0) section.children[xmlIndex] = newXml
  else section.children.push(newXml)

  return newSensor.id
}
