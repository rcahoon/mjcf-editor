import { nanoid } from 'nanoid'

export type NodeId = string

export function makeNodeId(): NodeId {
  return nanoid(10)
}

export interface XmlElementNode {
  kind: 'element'
  id: NodeId
  tag: string
  attrs: Record<string, string>
  children: XmlNode[]
}

export interface XmlCommentNode {
  kind: 'comment'
  id: NodeId
  text: string
}

export type XmlNode = XmlElementNode | XmlCommentNode

export function elementNode(
  tag: string,
  attrs: Record<string, string> = {},
  children: XmlNode[] = [],
): XmlElementNode {
  return { kind: 'element', id: makeNodeId(), tag, attrs, children }
}

export function findChild(node: XmlElementNode, tag: string): XmlElementNode | undefined {
  return node.children.find((c): c is XmlElementNode => c.kind === 'element' && c.tag === tag)
}

export function findChildren(node: XmlElementNode, tag: string): XmlElementNode[] {
  return node.children.filter((c): c is XmlElementNode => c.kind === 'element' && c.tag === tag)
}

export function getOrCreateChild(node: XmlElementNode, tag: string): XmlElementNode {
  const existing = findChild(node, tag)
  if (existing) return existing
  const created = elementNode(tag)
  node.children.push(created)
  return created
}

/**
 * Parses an XML string into our internal XmlNode tree (Layer 0). Every element
 * becomes an XmlElementNode carrying its raw attributes/children verbatim, so
 * attributes/elements this app doesn't specifically model round-trip untouched.
 */
export function parseXmlDocument(text: string): XmlElementNode {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    throw new Error(`Failed to parse XML: ${parserError.textContent}`)
  }
  const root = doc.documentElement
  if (!root) {
    throw new Error('XML document has no root element')
  }
  return domToXmlNode(root)
}

function domToXmlNode(el: Element): XmlElementNode {
  const attrs: Record<string, string> = {}
  for (const attr of Array.from(el.attributes)) {
    attrs[attr.name] = attr.value
  }
  const children: XmlNode[] = []
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(domToXmlNode(child as Element))
    } else if (child.nodeType === Node.COMMENT_NODE) {
      children.push({ kind: 'comment', id: makeNodeId(), text: child.textContent ?? '' })
    }
    // Text nodes (including whitespace-only indentation) are intentionally
    // dropped on parse; serialization re-indents on export via prettyPrint.
  }
  return { kind: 'element', id: makeNodeId(), tag: el.tagName, attrs, children }
}

/** Serializes the XmlNode tree (Layer 0) back into an XML string. */
export function serializeXmlDocument(root: XmlElementNode): string {
  const doc = document.implementation.createDocument(null, null, null)
  const domEl = xmlNodeToDom(doc, root)
  doc.appendChild(domEl)
  return new XMLSerializer().serializeToString(doc)
}

function xmlNodeToDom(doc: XMLDocument, node: XmlNode): Node {
  if (node.kind === 'comment') {
    return doc.createComment(node.text)
  }
  const el = doc.createElement(node.tag)
  for (const [key, value] of Object.entries(node.attrs)) {
    el.setAttribute(key, value)
  }
  for (const child of node.children) {
    el.appendChild(xmlNodeToDom(doc, child))
  }
  return el
}
