import { setAttr } from '../../core/mjcf/attrUtils'
import { parseSensor } from '../../core/mjcf/parseMjcf'
import { getOrCreateTopSection } from '../../core/mjcf/sections'
import { elementNode, type NodeId } from '../../core/xml/xmlNode'
import type { MjcfDocument, SensorEntry, SensorKind } from '../../core/mjcf/types'

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
  const attrs: Record<string, string> = {}
  if (targetName) {
    if (kind === 'jointpos' || kind === 'jointvel' || kind === 'jointactuatorfrc') attrs.joint = targetName
    else if (kind === 'framepos' || kind === 'framequat') {
      attrs.objtype = 'site'
      attrs.objname = targetName
    } else attrs.site = targetName
  }
  const xml = elementNode(kind, attrs)
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
