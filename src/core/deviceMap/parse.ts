import { makeNodeId, type XmlElementNode } from '../xml/xmlNode'
import { getAttr } from '../mjcf/attrUtils'
import { getDeviceAttr, parseDeviceData } from './attrs'
import { getIdSpaceInfo, isDeviceKind } from './idSpaces'
import type { DeviceKind, DeviceMapEntry } from './types'

function toNumber(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined
  const n = Number(raw)
  return Number.isNaN(n) ? undefined : n
}

/**
 * Parses a `<text name="dev.<idSpace>.<deviceId>" data="...">` element.
 * Deliberately tolerant: a malformed name or data string still produces an
 * entry (with `deviceId: NaN`, an undefined `resolvedKind`, etc.) rather
 * than throwing, so a broken file can be opened, displayed, and fixed
 * instead of failing to load. `core/mjcf/validate.ts` is what actually
 * enforces the spec's grammar and reports precise errors.
 */
export function parseDeviceMapEntry(xml: XmlElementNode): DeviceMapEntry {
  const name = getAttr(xml, 'name') ?? ''
  const afterPrefix = name.startsWith('dev.') ? name.slice(4) : name
  const parts = afterPrefix.split('.')
  const idSpace = parts[0] ?? ''
  const deviceId = parts.length === 2 ? Number.parseInt(parts[1], 10) : NaN

  const { pairs, malformedTokens } = parseDeviceData(getAttr(xml, 'data') ?? '')

  const explicitKindRaw = getDeviceAttr(pairs, 'kind')
  const explicitKind: DeviceKind | undefined =
    explicitKindRaw && isDeviceKind(explicitKindRaw) ? explicitKindRaw : undefined
  const resolvedKind = explicitKind ?? getIdSpaceInfo(idSpace)?.defaultKind ?? undefined

  return {
    id: makeNodeId(),
    idSpace,
    deviceId,
    explicitKind,
    resolvedKind,
    joint: getDeviceAttr(pairs, 'joint'),
    body: getDeviceAttr(pairs, 'body'),
    gear: toNumber(getDeviceAttr(pairs, 'gear')),
    motor: getDeviceAttr(pairs, 'motor'),
    currentLimit: toNumber(getDeviceAttr(pairs, 'currentLimit')),
    efficiency: toNumber(getDeviceAttr(pairs, 'efficiency')),
    actuator: getDeviceAttr(pairs, 'actuator'),
    ticksPerRevolution: toNumber(getDeviceAttr(pairs, 'ticksPerRevolution')),
    dataPairs: pairs,
    malformedTokens,
    xml,
  }
}
