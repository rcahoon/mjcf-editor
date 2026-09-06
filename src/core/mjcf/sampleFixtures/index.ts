import { SIMPLE_ARM_MJCF } from './simpleArm'

export interface SampleFixture {
  id: string
  label: string
  xml: string
}

export const SAMPLE_FIXTURES: SampleFixture[] = [{ id: 'simple-arm', label: 'Simple Arm (demo)', xml: SIMPLE_ARM_MJCF }]

export { SIMPLE_ARM_MJCF }
