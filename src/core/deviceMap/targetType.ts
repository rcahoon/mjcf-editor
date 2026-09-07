import type { DeviceKind } from './types'

/** Which kind of tree node a device's resolved kind must attach to —
 * motor/encoder devices reference a joint, imu/pose devices reference a
 * body. Undefined if there's no resolved kind yet (rule 10 violation). */
export function deviceRequiredTargetType(kind: DeviceKind | undefined): 'joint' | 'body' | undefined {
  if (kind === 'motor' || kind === 'encoder') return 'joint'
  if (kind === 'imu' || kind === 'pose') return 'body'
  return undefined
}
