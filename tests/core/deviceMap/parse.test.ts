import { describe, expect, it } from 'vitest'
import { parseMjcfString } from '../../../src/core/mjcf/parseMjcf'
import { serializeMjcfDocument } from '../../../src/core/mjcf/serializeMjcf'

const WORKED_EXAMPLE = `<mujoco model="example_arm">
  <compiler angle="radian" autolimits="true"/>
  <option timestep="0.0005" integrator="implicitfast" gravity="0 0 -9.81"/>
  <worldbody>
    <geom name="floor" type="plane" size="10 10 0.05"/>
    <body name="base" pos="0 0 0.1">
      <geom type="box" size="0.15 0.15 0.1" mass="20"/>
      <body name="upper_arm" pos="0 0 0.1">
        <joint name="shoulder" type="hinge" axis="0 1 0" armature="0.05" damping="0.05"/>
        <geom type="capsule" fromto="0 0 0 0.6 0 0" size="0.04" mass="2.5"/>
      </body>
    </body>
  </worldbody>
  <actuator>
    <motor name="shoulder_mtr" joint="shoulder"/>
  </actuator>
  <custom>
    <text name="dev.CTRE_MOTOR.9"  data="joint=shoulder gear=100 motor=KrakenX60 currentLimit=40"/>
    <text name="dev.CAN_CODER.31"  data="joint=shoulder gear=1 ticksPerRevolution=360"/>
    <text name="dev.PIGEON.1"      data="body=base"/>
    <text name="dev.SPECIAL.2"     data="body=base kind=pose"/>
    <text name="unrelated-metadata" data="anything goes here"/>
  </custom>
  <keyframe>
    <key name="start" qpos="0"/>
  </keyframe>
</mujoco>
`

describe('device map parsing (spec §10 worked example)', () => {
  it('parses all 4 dev.* entries with expected typed fields', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    expect(doc.deviceMap).toHaveLength(4)

    const motor = doc.deviceMap.find((d) => d.idSpace === 'CTRE_MOTOR')!
    expect(motor.deviceId).toBe(9)
    expect(motor.resolvedKind).toBe('motor')
    expect(motor.joint).toBe('shoulder')
    expect(motor.gear).toBe(100)
    expect(motor.motor).toBe('KrakenX60')
    expect(motor.currentLimit).toBe(40)

    const encoder = doc.deviceMap.find((d) => d.idSpace === 'CAN_CODER')!
    expect(encoder.deviceId).toBe(31)
    expect(encoder.resolvedKind).toBe('encoder')
    expect(encoder.joint).toBe('shoulder')
    expect(encoder.ticksPerRevolution).toBe(360)

    const imu = doc.deviceMap.find((d) => d.idSpace === 'PIGEON')!
    expect(imu.deviceId).toBe(1)
    expect(imu.resolvedKind).toBe('imu')
    expect(imu.body).toBe('base')

    const pose = doc.deviceMap.find((d) => d.idSpace === 'SPECIAL')!
    expect(pose.deviceId).toBe(2)
    expect(pose.resolvedKind).toBe('pose')
    expect(pose.explicitKind).toBe('pose')
    expect(pose.body).toBe('base')
  })

  it('leaves non-dev.* <text> entries untouched in customSection', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    const xml = serializeMjcfDocument(doc)
    expect(xml).toContain('unrelated-metadata')
  })

  it('round-trips an injected unknown data key', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    const motor = doc.deviceMap.find((d) => d.idSpace === 'CTRE_MOTOR')!
    motor.dataPairs.push({ key: 'someFutureKey', value: 'xyz' })
    motor.xml.attrs.data = motor.dataPairs.map((p) => `${p.key}=${p.value}`).join(' ')

    const xml = serializeMjcfDocument(doc)
    expect(xml).toContain('someFutureKey=xyz')
  })
})
