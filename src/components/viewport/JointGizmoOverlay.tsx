import { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import type { JointNode } from '../../core/mjcf/types'

const TYPE_COLOR: Record<JointNode['type'], string> = {
  hinge: '#38bdf8',
  slide: '#4ade80',
  ball: '#c084fc',
  free: '#9ca3af',
}

const AXIS_LENGTH = 0.12

interface JointAxisVisualProps {
  joint: JointNode
  isSelected: boolean
  onSelect: () => void
}

/** Renders a joint's fixed reference axis as an arrow at its pivot point,
 * plus a small pivot marker sphere — both clickable to select the joint.
 * Drawn at the pivot *before* any joint-motion rotation is applied, since
 * the axis is defined relative to the parent frame and doesn't move with
 * the joint's own preview/pose. */
export function JointAxisVisual({ joint, isSelected, onSelect }: JointAxisVisualProps) {
  const color = isSelected ? '#fbbf24' : TYPE_COLOR[joint.type]
  const axis = useMemo(() => new THREE.Vector3(...joint.axis).normalize(), [joint.axis])
  const points = useMemo((): [THREE.Vector3, THREE.Vector3] => {
    const half = axis.clone().multiplyScalar(AXIS_LENGTH / 2)
    return [half.clone().negate(), half]
  }, [axis])

  if (joint.type === 'free') return null

  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <mesh>
        <sphereGeometry args={[0.012, 12, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {joint.type !== 'ball' && <Line points={points} color={color} lineWidth={2} />}
    </group>
  )
}

/** axis-angle -> three.js quaternion array, for a hinge joint's preview rotation. */
export function axisAngleQuatArray(axis: [number, number, number], angleRad: number): [number, number, number, number] {
  const v = new THREE.Vector3(...axis)
  if (v.lengthSq() === 0) return [0, 0, 0, 1]
  v.normalize()
  const q = new THREE.Quaternion().setFromAxisAngle(v, angleRad)
  return [q.x, q.y, q.z, q.w]
}
