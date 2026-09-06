import { findBody, findBodyOwningJoint, findJoint } from '../../core/mjcf/queries'
import { setAttr, formatFloats } from '../../core/mjcf/attrUtils'
import { parseJoint } from '../../core/mjcf/parseMjcf'
import { elementNode, type NodeId } from '../../core/xml/xmlNode'
import type { JointNode, JointType, MjcfDocument } from '../../core/mjcf/types'

export type JointPatch = Partial<
  Pick<JointNode, 'name' | 'type' | 'pos' | 'axis' | 'range' | 'damping' | 'stiffness'>
>

export function setJointField(doc: MjcfDocument, jointId: NodeId, patch: JointPatch): void {
  const joint = findJoint(doc.worldbody, jointId)
  if (!joint) return
  if (patch.name !== undefined) {
    joint.name = patch.name.trim() || undefined
    setAttr(joint.xml, 'name', joint.name)
  }
  if (patch.type !== undefined) {
    joint.type = patch.type
    setAttr(joint.xml, 'type', patch.type)
  }
  if (patch.pos !== undefined) {
    joint.pos = patch.pos
    setAttr(joint.xml, 'pos', formatFloats(patch.pos))
  }
  if (patch.axis !== undefined) {
    joint.axis = patch.axis
    setAttr(joint.xml, 'axis', formatFloats(patch.axis))
  }
  if (patch.range !== undefined) {
    joint.range = patch.range
    setAttr(joint.xml, 'range', formatFloats(patch.range))
  }
  if (patch.damping !== undefined) {
    joint.damping = patch.damping
    setAttr(joint.xml, 'damping', formatFloats([patch.damping]))
  }
  if (patch.stiffness !== undefined) {
    joint.stiffness = patch.stiffness
    setAttr(joint.xml, 'stiffness', formatFloats([patch.stiffness]))
  }
}

export function addJoint(doc: MjcfDocument, bodyId: NodeId, type: JointType = 'hinge'): NodeId | undefined {
  const body = findBody(doc.worldbody, bodyId)
  if (!body) return undefined
  const xml = elementNode('joint', { type, axis: '0 0 1', pos: '0 0 0' })
  const joint = parseJoint(xml)
  body.joints.push(joint)
  body.xml.children.push(xml)
  return joint.id
}

export function deleteJoint(doc: MjcfDocument, jointId: NodeId): void {
  const body = findBodyOwningJoint(doc.worldbody, jointId)
  if (!body) return
  const joint = body.joints.find((j) => j.id === jointId)
  if (!joint) return
  body.joints = body.joints.filter((j) => j.id !== jointId)
  body.xml.children = body.xml.children.filter((c) => c.id !== joint.xml.id)
}
