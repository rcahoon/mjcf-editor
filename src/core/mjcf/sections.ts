import { elementNode, type XmlElementNode } from '../xml/xmlNode'
import type { MjcfDocument } from './types'

/** Finds (or creates and appends) a top-level `<mujoco>` child section like
 * `<actuator>`/`<sensor>`/`<asset>`, used when adding the first entry of a
 * kind to a document that doesn't have that section yet. */
export function getOrCreateTopSection(
  doc: MjcfDocument,
  tag: 'actuator' | 'sensor' | 'asset',
): XmlElementNode {
  const existing = doc.root.children.find(
    (c): c is XmlElementNode => c.kind === 'element' && c.tag === tag,
  )
  if (existing) return existing
  const created = elementNode(tag)
  doc.root.children.push(created)
  return created
}
