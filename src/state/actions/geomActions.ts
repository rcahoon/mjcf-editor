import { findBody, findBodyOwningGeom, findGeom } from '../../core/mjcf/queries'
import { setAttr, formatFloats } from '../../core/mjcf/attrUtils'
import { writeRotationRepr } from '../../core/mjcf/rotations'
import { parseGeom } from '../../core/mjcf/parseMjcf'
import { elementNode, type NodeId } from '../../core/xml/xmlNode'
import type { GeomNode, GeomType, MjcfDocument, RotationRepr, Vec3 } from '../../core/mjcf/types'

export type GeomPatch = Partial<
  Pick<GeomNode, 'name' | 'type' | 'meshRef' | 'size' | 'pos' | 'role' | 'materialRef' | 'rgba'>
>

export function setGeomField(doc: MjcfDocument, geomId: NodeId, patch: GeomPatch): void {
  const geom = findGeom(doc.worldbody, geomId)
  if (!geom) return
  if (patch.name !== undefined) {
    geom.name = patch.name.trim() || undefined
    setAttr(geom.xml, 'name', geom.name)
  }
  if (patch.type !== undefined) {
    geom.type = patch.type
    setAttr(geom.xml, 'type', patch.type)
  }
  if (patch.meshRef !== undefined) {
    geom.meshRef = patch.meshRef || undefined
    setAttr(geom.xml, 'mesh', geom.meshRef)
  }
  if (patch.size !== undefined) {
    geom.size = patch.size
    setAttr(geom.xml, 'size', formatFloats(patch.size))
  }
  if (patch.pos !== undefined) {
    geom.pos = patch.pos
    setAttr(geom.xml, 'pos', formatFloats(patch.pos))
  }
  if (patch.role !== undefined) {
    geom.role = patch.role
    if (patch.role === 'visual') {
      setAttr(geom.xml, 'contype', '0')
      setAttr(geom.xml, 'conaffinity', '0')
    } else {
      setAttr(geom.xml, 'contype', undefined)
      setAttr(geom.xml, 'conaffinity', undefined)
    }
  }
  if (patch.materialRef !== undefined) {
    geom.materialRef = patch.materialRef || undefined
    setAttr(geom.xml, 'material', geom.materialRef)
  }
  if (patch.rgba !== undefined) {
    geom.rgba = patch.rgba
    setAttr(geom.xml, 'rgba', formatFloats(patch.rgba))
  }
}

export function setGeomPos(doc: MjcfDocument, geomId: NodeId, pos: Vec3): void {
  setGeomField(doc, geomId, { pos })
}

export function setGeomRotation(doc: MjcfDocument, geomId: NodeId, rotation: RotationRepr): void {
  const geom = findGeom(doc.worldbody, geomId)
  if (!geom) return
  geom.rotation = rotation
  writeRotationRepr(geom.xml, rotation)
}

export function addGeom(doc: MjcfDocument, bodyId: NodeId, type: GeomType = 'box'): NodeId | undefined {
  const body = findBody(doc.worldbody, bodyId)
  if (!body) return undefined
  const xml = elementNode('geom', { type, size: '0.05 0.05 0.05', pos: '0 0 0' })
  const geom = parseGeom(xml)
  body.geoms.push(geom)
  body.xml.children.push(xml)
  return geom.id
}

export function deleteGeom(doc: MjcfDocument, geomId: NodeId): void {
  const body = findBodyOwningGeom(doc.worldbody, geomId)
  if (!body) return
  const geom = body.geoms.find((g) => g.id === geomId)
  if (!geom) return
  body.geoms = body.geoms.filter((g) => g.id !== geomId)
  body.xml.children = body.xml.children.filter((c) => c.id !== geom.xml.id)
}
