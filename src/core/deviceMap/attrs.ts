import type { DeviceDataPair } from './types'

/**
 * Parses the `data` attribute's `key=value key2=value2 ...` grammar (spec
 * §3.2): whitespace-separated tokens, split on the *first* `=`, last
 * duplicate key wins (silently, per spec) but keeps its original position.
 * A token with no `=` is malformed and is reported separately rather than
 * dropped silently, so validation can surface it.
 */
export function parseDeviceData(data: string): { pairs: DeviceDataPair[]; malformedTokens: string[] } {
  const pairs: DeviceDataPair[] = []
  const malformedTokens: string[] = []
  const positionByKey = new Map<string, number>()

  const tokens = data.trim().length > 0 ? data.trim().split(/\s+/) : []
  for (const token of tokens) {
    const eqIndex = token.indexOf('=')
    if (eqIndex === -1) {
      malformedTokens.push(token)
      continue
    }
    const key = token.slice(0, eqIndex)
    const value = token.slice(eqIndex + 1)
    const existingIndex = positionByKey.get(key)
    if (existingIndex !== undefined) {
      pairs[existingIndex] = { key, value }
    } else {
      positionByKey.set(key, pairs.length)
      pairs.push({ key, value })
    }
  }
  return { pairs, malformedTokens }
}

export function formatDeviceData(pairs: DeviceDataPair[]): string {
  return pairs.map((p) => `${p.key}=${p.value}`).join(' ')
}

export function getDeviceAttr(pairs: DeviceDataPair[], key: string): string | undefined {
  return pairs.find((p) => p.key === key)?.value
}

/** Mutates `pairs` in place: updates an existing key's value keeping its
 * position, appends a new key at the end, or removes it when `value` is
 * `undefined`. Mirrors `core/mjcf/attrUtils.ts`'s `setAttr` for this
 * data-string-shaped storage instead of real XML attributes. */
export function setDeviceAttr(pairs: DeviceDataPair[], key: string, value: string | undefined): void {
  const index = pairs.findIndex((p) => p.key === key)
  if (value === undefined) {
    if (index !== -1) pairs.splice(index, 1)
    return
  }
  if (index !== -1) pairs[index] = { key, value }
  else pairs.push({ key, value })
}
