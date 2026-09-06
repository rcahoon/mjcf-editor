import type { NodeId } from '../xml/xmlNode'
import type { BodyNode, GeomNode, JointNode, SiteNode } from './types'

export function findBody(root: BodyNode, id: NodeId): BodyNode | undefined {
  if (root.id === id) return root
  for (const c of root.children) {
    const found = findBody(c, id)
    if (found) return found
  }
  return undefined
}

export function findParentBody(root: BodyNode, childId: NodeId): BodyNode | undefined {
  for (const c of root.children) {
    if (c.id === childId) return root
    const found = findParentBody(c, childId)
    if (found) return found
  }
  return undefined
}

export function collectAllBodies(root: BodyNode): BodyNode[] {
  const out: BodyNode[] = [root]
  for (const c of root.children) out.push(...collectAllBodies(c))
  return out
}

export function collectAllJoints(root: BodyNode): JointNode[] {
  return collectAllBodies(root).flatMap((b) => b.joints)
}

export function collectAllSites(root: BodyNode): SiteNode[] {
  return collectAllBodies(root).flatMap((b) => b.sites)
}

export function collectAllGeoms(root: BodyNode): GeomNode[] {
  return collectAllBodies(root).flatMap((b) => b.geoms)
}

export function findJoint(root: BodyNode, id: NodeId): JointNode | undefined {
  return collectAllJoints(root).find((j) => j.id === id)
}

export function findGeom(root: BodyNode, id: NodeId): GeomNode | undefined {
  return collectAllGeoms(root).find((g) => g.id === id)
}

export function findSite(root: BodyNode, id: NodeId): SiteNode | undefined {
  return collectAllSites(root).find((s) => s.id === id)
}

export function findBodyOwningJoint(root: BodyNode, jointId: NodeId): BodyNode | undefined {
  return collectAllBodies(root).find((b) => b.joints.some((j) => j.id === jointId))
}

export function findBodyOwningGeom(root: BodyNode, geomId: NodeId): BodyNode | undefined {
  return collectAllBodies(root).find((b) => b.geoms.some((g) => g.id === geomId))
}

export function findBodyOwningSite(root: BodyNode, siteId: NodeId): BodyNode | undefined {
  return collectAllBodies(root).find((b) => b.sites.some((s) => s.id === siteId))
}

/** Suggests a unique name within an existing name set by appending _2, _3, ... */
export function suggestUniqueName(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base
  let i = 2
  while (existing.has(`${base}_${i}`)) i++
  return `${base}_${i}`
}
