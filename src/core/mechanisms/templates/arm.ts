import { elementNode } from '../../xml/xmlNode'
import { formatFloats } from '../../mjcf/attrUtils'
import type { MechanismTemplate } from '../types'

/**
 * A single-jointed arm: one hinge-jointed link with a capsule visual/collision
 * geom, a tip site, a matching actuator, and a jointpos feedback sensor.
 * FRC context: this is the building block for an arm/wrist mechanism —
 * chain two instances (with the second's attach point at the first's tip
 * body) to get a two-jointed arm.
 */
export const armTemplate: MechanismTemplate = {
  id: 'arm',
  name: 'Arm (single joint)',
  category: 'Arm',
  description: 'A hinge-jointed link with a motor and position feedback sensor.',
  params: [
    { key: 'length', label: 'Length (m)', type: 'number', default: 0.5, min: 0.05, max: 3, step: 0.01 },
    { key: 'linkRadius', label: 'Link radius (m)', type: 'number', default: 0.03, min: 0.005, max: 0.2, step: 0.005 },
    { key: 'mass', label: 'Mass (kg)', type: 'number', default: 2, min: 0.05, max: 50, step: 0.1 },
    { key: 'jointRangeMin', label: 'Joint range min (deg)', type: 'number', default: -90, min: -180, max: 180, step: 1 },
    { key: 'jointRangeMax', label: 'Joint range max (deg)', type: 'number', default: 90, min: -180, max: 180, step: 1 },
    { key: 'jointDamping', label: 'Joint damping', type: 'number', default: 0.3, min: 0, max: 10, step: 0.05 },
    {
      key: 'motorType',
      label: 'Motor type',
      type: 'enum',
      default: 'position',
      options: ['motor', 'position', 'velocity'],
    },
    { key: 'gearRatio', label: 'Gear ratio', type: 'number', default: 20, min: 1, max: 500, step: 1 },
  ],
  build: (params) => {
    const length = Number(params.length)
    const linkRadius = Number(params.linkRadius)
    const mass = Number(params.mass)
    const jointRangeMin = Number(params.jointRangeMin)
    const jointRangeMax = Number(params.jointRangeMax)
    const jointDamping = Number(params.jointDamping)
    const motorType = String(params.motorType) as 'motor' | 'position' | 'velocity'
    const gearRatio = Number(params.gearRatio)

    const joint = elementNode('joint', {
      name: 'joint',
      type: 'hinge',
      axis: '0 1 0',
      pos: '0 0 0',
      range: formatFloats([jointRangeMin, jointRangeMax]),
      damping: formatFloats([jointDamping]),
    })
    const inertial = elementNode('inertial', {
      pos: formatFloats([0, 0, length / 2]),
      mass: formatFloats([mass]),
      diaginertia: formatFloats([
        (mass * length * length) / 12,
        (mass * length * length) / 12,
        (mass * linkRadius * linkRadius) / 2,
      ]),
    })
    const geom = elementNode('geom', {
      name: 'link_geom',
      type: 'capsule',
      size: formatFloats([linkRadius, length / 2]),
      pos: formatFloats([0, 0, length / 2]),
      contype: '1',
      conaffinity: '1',
    })
    const tipSite = elementNode('site', { name: 'tip', pos: formatFloats([0, 0, length]), size: '0.01' })
    const link = elementNode('body', { name: 'link' }, [joint, inertial, geom, tipSite])

    const actuatorAttrs: Record<string, string> = { name: 'joint_actuator', joint: 'joint' }
    if (motorType === 'motor') {
      actuatorAttrs.gear = formatFloats([gearRatio])
    } else if (motorType === 'position') {
      actuatorAttrs.kp = formatFloats([gearRatio])
      actuatorAttrs.ctrlrange = formatFloats([
        (jointRangeMin * Math.PI) / 180,
        (jointRangeMax * Math.PI) / 180,
      ])
    } else {
      actuatorAttrs.kv = formatFloats([gearRatio])
    }
    const actuator = elementNode(motorType, actuatorAttrs)
    const sensor = elementNode('jointpos', { name: 'joint_pos_sensor', joint: 'joint' })

    return { bodies: [link], actuators: [actuator], sensors: [sensor], assets: [] }
  },
}
