import { serializeXmlDocument } from '../xml/xmlNode'
import { prettyPrintXml } from '../xml/prettyPrint'
import type { MjcfDocument } from './types'

/**
 * Serializes a document back to MJCF XML text. Since typed-model edits write
 * straight through to their backing XmlNode (Layer 0), this just serializes
 * the document's root — there is no separate "rebuild from typed fields"
 * step, which is what preserves unmodeled attributes/elements untouched.
 */
export function serializeMjcfDocument(doc: MjcfDocument): string {
  const xml = serializeXmlDocument(doc.root)
  return prettyPrintXml(xml)
}
