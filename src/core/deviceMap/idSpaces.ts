import type { DeviceKind } from './types'

export interface IdSpaceInfo {
  name: string
  value: number
  defaultKind: DeviceKind | null
}

/** The 14 `DeviceIdSpace` protobuf enum values (spec §4). Value 9 is reserved/unused. */
export const ID_SPACES: IdSpaceInfo[] = [
  { name: 'SPECIAL', value: 1, defaultKind: 'pose' },
  { name: 'DIGITAL_IO', value: 2, defaultKind: 'encoder' },
  { name: 'ANALOG_IO', value: 3, defaultKind: null },
  { name: 'PWM', value: 4, defaultKind: null },
  { name: 'RELAY', value: 5, defaultKind: null },
  { name: 'SPI', value: 6, defaultKind: null },
  { name: 'I2C', value: 7, defaultKind: null },
  { name: 'SOLENOID', value: 8, defaultKind: null },
  { name: 'CTRE_MOTOR', value: 10, defaultKind: 'motor' },
  { name: 'PIGEON', value: 11, defaultKind: 'imu' },
  { name: 'CAN_RANGE', value: 12, defaultKind: null },
  { name: 'CAN_CODER', value: 13, defaultKind: 'encoder' },
  { name: 'SPARK_MAX', value: 14, defaultKind: 'motor' },
  { name: 'XRP_MOTOR', value: 15, defaultKind: 'motor' },
]

const ID_SPACE_BY_NAME = new Map(ID_SPACES.map((s) => [s.name, s]))

/** Case-sensitive lookup, per spec §3.1. */
export function getIdSpaceInfo(name: string): IdSpaceInfo | undefined {
  return ID_SPACE_BY_NAME.get(name)
}

export function isKnownIdSpace(name: string): boolean {
  return ID_SPACE_BY_NAME.has(name)
}

/** Id spaces whose default (or a sensible explicit) kind is joint-attached. */
export const JOINT_ID_SPACES = ['CTRE_MOTOR', 'SPARK_MAX', 'XRP_MOTOR', 'CAN_CODER', 'DIGITAL_IO']
/** Id spaces whose default (or a sensible explicit) kind is body-attached. */
export const BODY_ID_SPACES = ['PIGEON', 'SPECIAL']

export interface MotorCatalogEntry {
  name: string
  freeSpeedRpm: number
  freeCurrentAmps: number
  stallTorqueNm: number
  stallCurrentAmps: number
}

/** The 8-entry motor catalog (spec §5.5), each characterized at 12V. */
export const MOTOR_CATALOG: MotorCatalogEntry[] = [
  { name: 'KrakenX60', freeSpeedRpm: 6000, freeCurrentAmps: 2.0, stallTorqueNm: 7.09, stallCurrentAmps: 366 },
  { name: 'KrakenX60FOC', freeSpeedRpm: 5800, freeCurrentAmps: 2.0, stallTorqueNm: 9.37, stallCurrentAmps: 483 },
  { name: 'Falcon500', freeSpeedRpm: 6380, freeCurrentAmps: 1.5, stallTorqueNm: 4.69, stallCurrentAmps: 257 },
  { name: 'NEO', freeSpeedRpm: 5880, freeCurrentAmps: 1.3, stallTorqueNm: 3.36, stallCurrentAmps: 166 },
  { name: 'NEO550', freeSpeedRpm: 11710, freeCurrentAmps: 1.1, stallTorqueNm: 1.08, stallCurrentAmps: 111 },
  { name: 'CIM', freeSpeedRpm: 5330, freeCurrentAmps: 2.7, stallTorqueNm: 2.41, stallCurrentAmps: 131 },
  { name: 'MiniCIM', freeSpeedRpm: 5840, freeCurrentAmps: 3.0, stallTorqueNm: 1.41, stallCurrentAmps: 89 },
  { name: 'Motor775Pro', freeSpeedRpm: 18730, freeCurrentAmps: 0.7, stallTorqueNm: 0.71, stallCurrentAmps: 134 },
]

const MOTOR_NAMES = new Set(MOTOR_CATALOG.map((m) => m.name))

export function isKnownMotor(name: string): boolean {
  return MOTOR_NAMES.has(name)
}

export const DEVICE_KINDS: DeviceKind[] = ['motor', 'encoder', 'imu', 'pose']

export function isDeviceKind(value: string): value is DeviceKind {
  return (DEVICE_KINDS as string[]).includes(value)
}
