import type { NodeId, XmlElementNode } from '../xml/xmlNode'

export type DeviceKind = 'motor' | 'encoder' | 'imu' | 'pose'

export interface DeviceDataPair {
  key: string
  value: string
}

/**
 * One `<text name="dev.<idSpace>.<deviceId>" data="...">` entry from the
 * device map (spec §2-§5). Parsing is deliberately tolerant — an
 * unrecognized idSpace, an unparseable deviceId, or a missing kind all
 * still produce an entry (so the file round-trips and the editor's own
 * validation can flag the problem) rather than throwing.
 */
export interface DeviceMapEntry {
  id: NodeId
  /** Raw string, not a strict union — an unrecognized value must still round-trip. */
  idSpace: string
  /** NaN if the id portion of `name` didn't parse as an integer. */
  deviceId: number
  /** Present only when `data` had an explicit `kind=` token. */
  explicitKind?: DeviceKind
  /** `explicitKind`, else the idSpace's registered default, else undefined (a rule-10 violation). */
  resolvedKind?: DeviceKind

  // Kind-specific fields (see spec §5), all optional since only some apply per kind.
  joint?: string
  body?: string
  gear?: number
  motor?: string
  currentLimit?: number
  efficiency?: number
  actuator?: string
  ticksPerRevolution?: number

  /** Ordered, de-duplicated key/value pairs — source of truth for round-trip
   * fidelity (including keys this editor doesn't know about) and for the
   * serialized `data` string's token order. */
  dataPairs: DeviceDataPair[]
  /** Whitespace-separated `data` tokens with no `=` (spec §3.2, rule 5) — kept for display, excluded from dataPairs. */
  malformedTokens: string[]

  xml: XmlElementNode
}
