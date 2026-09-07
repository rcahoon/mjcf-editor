import { findChildren, getOrCreateChild, type XmlElementNode } from '../xml/xmlNode'
import { getAttr } from './attrUtils'
import type { MjcfDocument } from './types'

/** `<keyframe>` isn't modeled in depth (it stays in `rawSections` verbatim);
 * this is just enough read access to check §7.2 ("at least one keyframe
 * exists") and to list them in the Settings panel. */
export function findKeyframeSection(doc: MjcfDocument): XmlElementNode | undefined {
  return doc.rawSections.find((s) => s.tag === 'keyframe')
}

export function listKeyframeNames(doc: MjcfDocument): string[] {
  const section = findKeyframeSection(doc)
  if (!section) return []
  return findChildren(section, 'key').map((k, i) => getAttr(k, 'name') ?? `(unnamed ${i})`)
}

/** Gets the `<keyframe>` section, creating and registering it in
 * `rawSections` if this document doesn't have one yet. */
export function getOrCreateKeyframeSection(doc: MjcfDocument): XmlElementNode {
  const existing = findKeyframeSection(doc)
  if (existing) return existing
  const created = getOrCreateChild(doc.root, 'keyframe')
  doc.rawSections.push(created)
  return created
}
