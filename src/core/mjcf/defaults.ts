import type { Vec3 } from './types'

/** A handful of MJCF's documented default attribute values, used when an
 * attribute is omitted from the source XML. Not exhaustive — covers the
 * attributes this editor reads/writes. */
export const MJCF_DEFAULTS = {
  compiler: { angle: 'degree' as const, eulerseq: 'xyz' },
  body: { pos: [0, 0, 0] as Vec3 },
  joint: { type: 'hinge' as const, pos: [0, 0, 0] as Vec3, axis: [0, 0, 1] as Vec3 },
  geom: { type: 'sphere' as const, pos: [0, 0, 0] as Vec3, size: [1] as number[] },
  site: { pos: [0, 0, 0] as Vec3, size: [0.005] as number[] },
  actuator: { gear: 1 },
}
