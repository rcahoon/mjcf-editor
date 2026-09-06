import type { XmlElementNode } from '../xml/xmlNode'

export function getAttr(xml: XmlElementNode, key: string): string | undefined {
  return xml.attrs[key]
}

export function setAttr(xml: XmlElementNode, key: string, value: string | undefined): void {
  if (value === undefined) {
    delete xml.attrs[key]
  } else {
    xml.attrs[key] = value
  }
}

export function parseFloatsAttr(xml: XmlElementNode, key: string): number[] | undefined {
  const raw = getAttr(xml, key)
  if (raw === undefined || raw.trim() === '') return undefined
  return raw.trim().split(/\s+/).map(Number)
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n)
  const rounded = Math.round(n * 1e6) / 1e6
  return String(rounded)
}

export function formatFloats(nums: number[]): string {
  return nums.map(formatNum).join(' ')
}

export function parseVec3Attr(xml: XmlElementNode, key: string): [number, number, number] | undefined {
  const v = parseFloatsAttr(xml, key)
  if (!v) return undefined
  return [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0]
}
