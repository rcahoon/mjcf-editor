import { describe, expect, it } from 'vitest'
import { orientationToQuat, quatToOrientation } from '../../../src/core/mjcf/rotations'
import type { Quat } from '../../../src/core/mjcf/types'

function expectCloseQuat(a: Quat, b: Quat, eps = 1e-6): void {
  // Quaternions q and -q represent the same rotation.
  const same = a.every((v, i) => Math.abs(v - b[i]) < eps)
  const flipped = a.every((v, i) => Math.abs(v + b[i]) < eps)
  expect(same || flipped).toBe(true)
}

describe('rotation conversions', () => {
  it('identity quat stays identity', () => {
    const q = orientationToQuat({ kind: 'quat', quat: [1, 0, 0, 0] }, 'degree', 'xyz')
    expectCloseQuat(q, [1, 0, 0, 0])
  })

  it('90deg axisangle about Z matches equivalent quat', () => {
    const q = orientationToQuat({ kind: 'axisangle', axis: [0, 0, 1], angle: 90 }, 'degree', 'xyz')
    const expected: Quat = [Math.SQRT1_2, 0, 0, Math.SQRT1_2]
    expectCloseQuat(q, expected, 1e-5)
  })

  it('euler round-trips through quat back to euler for a simple case', () => {
    const original = { kind: 'euler' as const, euler: [30, 0, 0] as [number, number, number] }
    const q = orientationToQuat(original, 'degree', 'xyz')
    const back = quatToOrientation(q, 'degree', 'xyz', 'euler')
    expect(back.kind).toBe('euler')
    if (back.kind === 'euler') {
      expect(back.euler[0]).toBeCloseTo(30, 3)
      expect(back.euler[1]).toBeCloseTo(0, 3)
      expect(back.euler[2]).toBeCloseTo(0, 3)
    }
  })

  it('zaxis produces a quat that rotates +Z onto the given axis', () => {
    const q = orientationToQuat({ kind: 'zaxis', zaxis: [1, 0, 0] }, 'degree', 'xyz')
    // Rotating [0,0,1] by q should yield approximately [1,0,0].
    const [w, x, y, z] = q
    // v' = q * (0,0,1) * q^-1, computed directly for a unit quaternion:
    const vx = 2 * (x * z + w * y)
    const vy = 2 * (y * z - w * x)
    const vz = 1 - 2 * (x * x + y * y)
    expect(vx).toBeCloseTo(1, 5)
    expect(vy).toBeCloseTo(0, 5)
    expect(vz).toBeCloseTo(0, 5)
  })
})
