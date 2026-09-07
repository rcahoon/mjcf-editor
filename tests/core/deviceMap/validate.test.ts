import { describe, expect, it } from 'vitest'
import { parseMjcfString } from '../../../src/core/mjcf/parseMjcf'
import { validateMjcfDocument } from '../../../src/core/mjcf/validate'
import { setAttr } from '../../../src/core/mjcf/attrUtils'

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
  </custom>
  <keyframe>
    <key name="start" qpos="0"/>
  </keyframe>
</mujoco>
`

function deviceIssues(doc: ReturnType<typeof parseMjcfString>) {
  return validateMjcfDocument(doc).filter((i) => i.nodeKind === 'device')
}

describe('device map validation', () => {
  it('produces no issues for the spec-compliant worked example', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    const issues = validateMjcfDocument(doc)
    expect(issues).toEqual([])
  })

  it('flags an unknown ID space', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    const entry = doc.deviceMap.find((d) => d.idSpace === 'PIGEON')!
    setAttr(entry.xml, 'name', 'dev.PIDGEON.1') // typo
    entry.idSpace = 'PIDGEON'
    const issues = deviceIssues(doc)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('unknown ID space'))).toBe(true)
  })

  it('flags a non-integer device id', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    const entry = doc.deviceMap.find((d) => d.idSpace === 'PIGEON')!
    entry.deviceId = Number.NaN
    const issues = deviceIssues(doc)
    expect(issues.some((i) => i.message.includes("isn't an integer"))).toBe(true)
  })

  it('flags duplicate (idSpace, deviceId) pairs', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    const pigeon = doc.deviceMap.find((d) => d.idSpace === 'PIGEON')!
    const motor = doc.deviceMap.find((d) => d.idSpace === 'CTRE_MOTOR')!
    motor.idSpace = pigeon.idSpace
    motor.deviceId = pigeon.deviceId
    const issues = deviceIssues(doc)
    expect(issues.some((i) => i.message.includes('Duplicate device identity'))).toBe(true)
  })

  it('flags a malformed data token', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    const entry = doc.deviceMap.find((d) => d.idSpace === 'CTRE_MOTOR')!
    entry.malformedTokens.push('gearRatio6.75')
    const issues = deviceIssues(doc)
    expect(issues.some((i) => i.message.includes('malformed data token'))).toBe(true)
  })

  it('flags a non-numeric numeric attribute', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    const entry = doc.deviceMap.find((d) => d.idSpace === 'CTRE_MOTOR')!
    entry.dataPairs.push({ key: 'gear', value: 'abc' })
    // Simulate the raw data string actually saying gear=abc (dataPairs already has gear=100 from parse,
    // so overwrite it to isolate the case instead of appending a duplicate).
    entry.dataPairs = entry.dataPairs.filter((p) => p.key !== 'gear')
    entry.dataPairs.push({ key: 'gear', value: 'abc' })
    const issues = deviceIssues(doc)
    expect(issues.some((i) => i.message.includes("isn't a number"))).toBe(true)
  })

  it('flags an unknown motor catalog name', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    const entry = doc.deviceMap.find((d) => d.idSpace === 'CTRE_MOTOR')!
    entry.motor = 'FlyByNightMotor9000'
    const issues = deviceIssues(doc)
    expect(issues.some((i) => i.message.includes('unknown motor'))).toBe(true)
  })

  it('requires an explicit kind for an ID space with no default', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    const entry = doc.deviceMap.find((d) => d.idSpace === 'PIGEON')!
    entry.idSpace = 'ANALOG_IO'
    entry.resolvedKind = undefined
    entry.explicitKind = undefined
    const issues = deviceIssues(doc)
    expect(issues.some((i) => i.message.includes('no default kind'))).toBe(true)
  })

  it('warns when explicit kind differs from the ID space default', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    const entry = doc.deviceMap.find((d) => d.idSpace === 'PIGEON')! // default: imu
    entry.explicitKind = 'pose'
    const issues = deviceIssues(doc)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('overrides'))).toBe(true)
  })

  it('flags a dangling joint reference', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    const entry = doc.deviceMap.find((d) => d.idSpace === 'CTRE_MOTOR')!
    entry.joint = 'nonexistent_joint'
    const issues = deviceIssues(doc)
    expect(issues.some((i) => i.message.includes('unknown joint'))).toBe(true)
  })

  it('flags zero matching actuators for a motor device with no explicit actuator', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    doc.actuators = [] // remove the only actuator targeting "shoulder"
    const issues = deviceIssues(doc)
    expect(issues.some((i) => i.message.includes('no actuator targets joint'))).toBe(true)
  })

  it('flags multiple matching actuators for a motor device with no explicit actuator', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    doc.actuators.push({ ...doc.actuators[0], id: 'dup-actuator', name: 'second_mtr' })
    const issues = deviceIssues(doc)
    expect(issues.some((i) => i.message.includes('actuators target joint'))).toBe(true)
  })

  it('flags timestep that does not evenly divide the control period', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    doc.option.timestep = 0.0007
    setAttr(doc.option.xml, 'timestep', '0.0007')
    const issues = validateMjcfDocument(doc)
    expect(issues.some((i) => i.message.includes('does not evenly divide'))).toBe(true)
  })

  it('warns when no keyframe is defined', () => {
    const doc = parseMjcfString(WORKED_EXAMPLE)
    doc.rawSections = doc.rawSections.filter((s) => s.tag !== 'keyframe')
    const issues = validateMjcfDocument(doc)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('No <keyframe>'))).toBe(true)
  })
})
