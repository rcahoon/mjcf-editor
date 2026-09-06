import { findBody, findBodyOwningSite, findSite } from '../../core/mjcf/queries'
import { setAttr, formatFloats } from '../../core/mjcf/attrUtils'
import { writeRotationRepr } from '../../core/mjcf/rotations'
import { parseSite } from '../../core/mjcf/parseMjcf'
import { elementNode, type NodeId } from '../../core/xml/xmlNode'
import type { MjcfDocument, RotationRepr, SiteNode, Vec3 } from '../../core/mjcf/types'

export type SitePatch = Partial<Pick<SiteNode, 'name' | 'pos' | 'size'>>

export function setSiteField(doc: MjcfDocument, siteId: NodeId, patch: SitePatch): void {
  const site = findSite(doc.worldbody, siteId)
  if (!site) return
  if (patch.name !== undefined) {
    site.name = patch.name.trim() || undefined
    setAttr(site.xml, 'name', site.name)
  }
  if (patch.pos !== undefined) {
    site.pos = patch.pos
    setAttr(site.xml, 'pos', formatFloats(patch.pos))
  }
  if (patch.size !== undefined) {
    site.size = patch.size
    setAttr(site.xml, 'size', formatFloats(patch.size))
  }
}

export function setSitePos(doc: MjcfDocument, siteId: NodeId, pos: Vec3): void {
  setSiteField(doc, siteId, { pos })
}

export function setSiteRotation(doc: MjcfDocument, siteId: NodeId, rotation: RotationRepr): void {
  const site = findSite(doc.worldbody, siteId)
  if (!site) return
  site.rotation = rotation
  writeRotationRepr(site.xml, rotation)
}

export function addSite(doc: MjcfDocument, bodyId: NodeId, name: string): NodeId | undefined {
  const body = findBody(doc.worldbody, bodyId)
  if (!body) return undefined
  const xml = elementNode('site', { name, pos: '0 0 0', size: '0.01' })
  const site = parseSite(xml)
  body.sites.push(site)
  body.xml.children.push(xml)
  return site.id
}

export function deleteSite(doc: MjcfDocument, siteId: NodeId): void {
  const body = findBodyOwningSite(doc.worldbody, siteId)
  if (!body) return
  const site = body.sites.find((s) => s.id === siteId)
  if (!site) return
  body.sites = body.sites.filter((s) => s.id !== siteId)
  body.xml.children = body.xml.children.filter((c) => c.id !== site.xml.id)
}
