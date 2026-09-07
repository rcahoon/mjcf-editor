import { describe, expect, it } from 'vitest'
import { resolveSensorKindForTarget } from '../../../src/state/actions/sensorActions'

describe('resolveSensorKindForTarget', () => {
  it('converts jointpos <-> framepos', () => {
    expect(resolveSensorKindForTarget('jointpos', 'site')).toBe('framepos')
    expect(resolveSensorKindForTarget('framepos', 'joint')).toBe('jointpos')
  })

  it('converts jointvel <-> velocimeter', () => {
    expect(resolveSensorKindForTarget('jointvel', 'site')).toBe('velocimeter')
    expect(resolveSensorKindForTarget('velocimeter', 'joint')).toBe('jointvel')
  })

  it('converts jointactuatorfrc <-> force', () => {
    expect(resolveSensorKindForTarget('jointactuatorfrc', 'site')).toBe('force')
    expect(resolveSensorKindForTarget('force', 'joint')).toBe('jointactuatorfrc')
  })

  it('keeps kind unchanged when already compatible with the target type', () => {
    expect(resolveSensorKindForTarget('jointpos', 'joint')).toBe('jointpos')
    expect(resolveSensorKindForTarget('gyro', 'site')).toBe('gyro')
  })

  it('rejects kinds with no equivalent on the other target type', () => {
    expect(resolveSensorKindForTarget('gyro', 'joint')).toBeUndefined()
    expect(resolveSensorKindForTarget('accelerometer', 'joint')).toBeUndefined()
    expect(resolveSensorKindForTarget('framequat', 'joint')).toBeUndefined()
    expect(resolveSensorKindForTarget('torque', 'joint')).toBeUndefined()
  })
})
