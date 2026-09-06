import { setAttr, formatFloats } from '../../core/mjcf/attrUtils'
import { parseActuator } from '../../core/mjcf/parseMjcf'
import { getOrCreateTopSection } from '../../core/mjcf/sections'
import { elementNode, type NodeId } from '../../core/xml/xmlNode'
import type { ActuatorEntry, ActuatorKind, MjcfDocument } from '../../core/mjcf/types'

export type ActuatorPatch = Partial<
  Pick<ActuatorEntry, 'name' | 'gear' | 'ctrlrange' | 'forcerange' | 'kp' | 'kv'>
>

export function setActuatorField(doc: MjcfDocument, actuatorId: NodeId, patch: ActuatorPatch): void {
  const actuator = doc.actuators.find((a) => a.id === actuatorId)
  if (!actuator) return
  if (patch.name !== undefined) {
    actuator.name = patch.name.trim() || undefined
    setAttr(actuator.xml, 'name', actuator.name)
  }
  if (patch.gear !== undefined) {
    actuator.gear = patch.gear
    setAttr(actuator.xml, 'gear', formatFloats([patch.gear]))
  }
  if (patch.ctrlrange !== undefined) {
    actuator.ctrlrange = patch.ctrlrange
    setAttr(actuator.xml, 'ctrlrange', formatFloats(patch.ctrlrange))
  }
  if (patch.forcerange !== undefined) {
    actuator.forcerange = patch.forcerange
    setAttr(actuator.xml, 'forcerange', formatFloats(patch.forcerange))
  }
  if (patch.kp !== undefined) {
    actuator.kp = patch.kp
    setAttr(actuator.xml, 'kp', formatFloats([patch.kp]))
  }
  if (patch.kv !== undefined) {
    actuator.kv = patch.kv
    setAttr(actuator.xml, 'kv', formatFloats([patch.kv]))
  }
}

export function setActuatorTarget(
  doc: MjcfDocument,
  actuatorId: NodeId,
  target: ActuatorEntry['target'],
): void {
  const actuator = doc.actuators.find((a) => a.id === actuatorId)
  if (!actuator) return
  actuator.target = target
  setAttr(actuator.xml, 'joint', target.type === 'joint' ? target.name : undefined)
  setAttr(actuator.xml, 'site', target.type === 'site' ? target.name : undefined)
}

export function addActuator(doc: MjcfDocument, kind: ActuatorKind, jointName?: string): NodeId {
  const xml = elementNode(kind, jointName ? { joint: jointName } : {})
  const actuator = parseActuator(xml)
  doc.actuators.push(actuator)
  getOrCreateTopSection(doc, 'actuator').children.push(xml)
  return actuator.id
}

export function deleteActuator(doc: MjcfDocument, actuatorId: NodeId): void {
  const actuator = doc.actuators.find((a) => a.id === actuatorId)
  if (!actuator) return
  doc.actuators = doc.actuators.filter((a) => a.id !== actuatorId)
  const section = getOrCreateTopSection(doc, 'actuator')
  section.children = section.children.filter((c) => c.id !== actuator.xml.id)
}
