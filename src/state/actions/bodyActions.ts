import { findBody, findParentBody } from '../../core/mjcf/queries'
import { setAttr, formatFloats } from '../../core/mjcf/attrUtils'
import { writeRotationRepr } from '../../core/mjcf/rotations'
import { parseBody } from '../../core/mjcf/parseMjcf'
import { elementNode, type NodeId } from '../../core/xml/xmlNode'
import type { MjcfDocument, RotationRepr, Vec3 } from '../../core/mjcf/types'

export function setBodyName(doc: MjcfDocument, bodyId: NodeId, name: string): void {
  const body = findBody(doc.worldbody, bodyId)
  if (!body) return
  const trimmed = name.trim() || undefined
  body.name = trimmed
  setAttr(body.xml, 'name', trimmed)
}

export function setBodyPos(doc: MjcfDocument, bodyId: NodeId, pos: Vec3): void {
  const body = findBody(doc.worldbody, bodyId)
  if (!body) return
  body.pos = pos
  setAttr(body.xml, 'pos', formatFloats(pos))
}

export function setBodyRotation(doc: MjcfDocument, bodyId: NodeId, rotation: RotationRepr): void {
  const body = findBody(doc.worldbody, bodyId)
  if (!body) return
  body.rotation = rotation
  writeRotationRepr(body.xml, rotation)
}

export function addBody(doc: MjcfDocument, parentBodyId: NodeId, name: string): NodeId | undefined {
  const parent = findBody(doc.worldbody, parentBodyId)
  if (!parent) return undefined
  const xml = elementNode('body', { name, pos: '0 0 0' })
  const body = parseBody(xml)
  parent.children.push(body)
  parent.xml.children.push(xml)
  return body.id
}

export function deleteBody(doc: MjcfDocument, bodyId: NodeId): void {
  if (doc.worldbody.id === bodyId) return
  const parent = findParentBody(doc.worldbody, bodyId)
  if (!parent) return
  const body = parent.children.find((b) => b.id === bodyId)
  if (!body) return
  parent.children = parent.children.filter((b) => b.id !== bodyId)
  parent.xml.children = parent.xml.children.filter((c) => c.id !== body.xml.id)
}
