import { describe, expect, it } from 'vitest'
import { expandInstance } from '../../../src/core/mechanisms/namespace'
import { armTemplate } from '../../../src/core/mechanisms/templates/arm'
import { collectAllJoints, collectAllBodies } from '../../../src/core/mjcf/queries'
import type { BodyNode } from '../../../src/core/mjcf/types'

function fakeRoot(children: BodyNode[]): BodyNode {
  return {
    id: 'root',
    pos: [0, 0, 0],
    rotation: { kind: 'quat', quat: [1, 0, 0, 0] },
    joints: [],
    geoms: [],
    sites: [],
    children,
    xml: { kind: 'element', id: 'root-xml', tag: 'worldbody', attrs: {}, children: [] },
  }
}

describe('mechanism instance namespacing', () => {
  it('produces disjoint, correctly-prefixed names for two instances of the same template', () => {
    const params = {
      length: 0.5,
      linkRadius: 0.03,
      mass: 2,
      jointRangeMin: -90,
      jointRangeMax: 90,
      jointDamping: 0.3,
      motorType: 'position',
      gearRatio: 20,
      motorIdSpace: 'CTRE_MOTOR',
    }
    const left = expandInstance(armTemplate, { ...params, motorCanId: 10 }, 'left_arm')
    const right = expandInstance(armTemplate, { ...params, motorCanId: 11 }, 'right_arm')

    const root = fakeRoot([...left.bodies, ...right.bodies])
    const jointNames = collectAllJoints(root).map((j) => j.name)
    expect(jointNames).toEqual(['left_arm_joint', 'right_arm_joint'])
    expect(new Set(jointNames).size).toBe(jointNames.length)

    const bodyNames = collectAllBodies(root)
      .map((b) => b.name)
      .filter(Boolean)
    expect(bodyNames).toEqual(['left_arm_link', 'right_arm_link'])

    // Actuator/sensor targets must resolve within their own instance's namespace.
    expect(left.actuators[0].target.name).toBe('left_arm_joint')
    expect(right.actuators[0].target.name).toBe('right_arm_joint')
    expect(left.sensors[0].target.name).toBe('left_arm_joint')
    expect(right.sensors[0].target.name).toBe('right_arm_joint')

    // Site names are also namespaced.
    expect(left.bodies[0].sites[0].name).toBe('left_arm_tip')
    expect(right.bodies[0].sites[0].name).toBe('right_arm_tip')

    // Each instance's device gets a distinct CAN ID (a user-supplied param,
    // not namespace-derived) but its data string's joint= reference is
    // namespaced the same way as everything else in the fragment.
    expect(left.devices).toHaveLength(1)
    expect(right.devices).toHaveLength(1)
    expect(left.devices[0].deviceId).toBe(10)
    expect(right.devices[0].deviceId).toBe(11)
    expect(left.devices[0].joint).toBe('left_arm_joint')
    expect(right.devices[0].joint).toBe('right_arm_joint')
  })
})
