import { elementNode, type XmlElementNode } from '../../xml/xmlNode'
import { formatFloats } from '../../mjcf/attrUtils'
import type { MechanismTemplate } from '../types'

/**
 * A telescoping elevator: a cascade of slide-jointed stages. Only the first
 * (outermost) stage carries an actuator + drum radius, matching a typical
 * FRC cascade elevator where later stages are cable-coupled to the driven
 * stage rather than independently actuated. Cable coupling itself (the
 * kinematic constraint that makes stage 2 move with stage 1) is not modeled
 * here — a documented simplification, since this editor doesn't model MJCF
 * tendons/equality constraints yet.
 */
export const elevatorTemplate: MechanismTemplate = {
  id: 'elevator',
  name: 'Elevator (cascade)',
  category: 'Elevator',
  description: 'A cascade of telescoping slide-jointed stages with a driven first stage.',
  params: [
    { key: 'stageCount', label: 'Stage count', type: 'number', default: 2, min: 1, max: 4, step: 1 },
    { key: 'stageTravel', label: 'Stage travel (m)', type: 'number', default: 0.6, min: 0.05, max: 2, step: 0.01 },
    { key: 'stageWidth', label: 'Stage width (m)', type: 'number', default: 0.08, min: 0.02, max: 0.3, step: 0.005 },
    { key: 'carriageMass', label: 'Carriage mass (kg)', type: 'number', default: 4, min: 0.1, max: 50, step: 0.1 },
    {
      key: 'motorType',
      label: 'Motor type',
      type: 'enum',
      default: 'position',
      options: ['motor', 'position', 'velocity'],
    },
    { key: 'gearRatio', label: 'Gear ratio', type: 'number', default: 15, min: 1, max: 500, step: 1 },
    { key: 'drumRadius', label: 'Drum radius (m)', type: 'number', default: 0.025, min: 0.005, max: 0.15, step: 0.005 },
  ],
  build: (params) => {
    const stageCount = Math.max(1, Math.round(Number(params.stageCount)))
    const stageTravel = Number(params.stageTravel)
    const stageWidth = Number(params.stageWidth)
    const carriageMass = Number(params.carriageMass)
    const motorType = String(params.motorType) as 'motor' | 'position' | 'velocity'
    const gearRatio = Number(params.gearRatio)
    const drumRadius = Number(params.drumRadius)

    function buildStage(stageIndex: number): XmlElementNode {
      const isLast = stageIndex === stageCount
      const jointName = `stage_${stageIndex}_joint`
      const joint = elementNode('joint', {
        name: jointName,
        type: 'slide',
        axis: '0 0 1',
        pos: '0 0 0',
        range: formatFloats([0, stageTravel]),
        damping: '0.1',
      })
      const geom = elementNode('geom', {
        name: `stage_${stageIndex}_geom`,
        type: 'box',
        size: formatFloats([stageWidth / 2, stageWidth / 2, stageTravel / 2]),
        pos: formatFloats([0, 0, stageTravel / 2]),
        contype: '1',
        conaffinity: '1',
      })
      const inertial = elementNode('inertial', {
        pos: formatFloats([0, 0, stageTravel / 2]),
        mass: formatFloats([isLast ? carriageMass : 1]),
        diaginertia: formatFloats([0.01, 0.01, 0.005]),
      })
      const children: XmlElementNode[] = [joint, inertial, geom]
      if (isLast) {
        children.push(elementNode('site', { name: 'carriage_site', pos: formatFloats([0, 0, stageTravel]), size: '0.01' }))
      } else {
        const nextStage = buildStage(stageIndex + 1)
        nextStage.attrs.pos = formatFloats([0, 0, stageTravel])
        children.push(nextStage)
      }
      return elementNode('body', { name: `stage_${stageIndex}` }, children)
    }

    const firstStage = buildStage(1)

    const actuatorAttrs: Record<string, string> = { name: 'lift_actuator', joint: 'stage_1_joint' }
    if (motorType === 'motor') {
      actuatorAttrs.gear = formatFloats([gearRatio * drumRadius])
    } else if (motorType === 'position') {
      actuatorAttrs.kp = formatFloats([gearRatio])
      actuatorAttrs.ctrlrange = formatFloats([0, stageTravel])
    } else {
      actuatorAttrs.kv = formatFloats([gearRatio])
    }
    const actuator = elementNode(motorType, actuatorAttrs)
    const sensor = elementNode('jointpos', { name: 'lift_pos_sensor', joint: 'stage_1_joint' })

    return { bodies: [firstStage], actuators: [actuator], sensors: [sensor], assets: [] }
  },
}
