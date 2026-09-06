import { useMemo } from 'react'
import * as THREE from 'three'
import { useEditorStore } from '../../state/store'
import { reprToThreeQuaternion } from '../../core/mjcf/rotations'
import type { GeomNode, MjcfDocument } from '../../core/mjcf/types'
import {
  ZUP_TO_YUP_CORRECTION,
  buildPrimitiveGeometry,
  needsZUpCorrection,
  primitiveScale,
  useMeshGeometry,
} from './geomGeometry'

interface GeomMeshProps {
  geom: GeomNode
  doc: MjcfDocument
  isSelected: boolean
  onSelect: () => void
}

const DEFAULT_COLOR = new THREE.Color(0.7, 0.72, 0.75)

export function GeomMesh({ geom, doc, isSelected, onSelect }: GeomMeshProps) {
  const showVisual = useEditorStore((s) => s.showVisual)
  const showCollision = useEditorStore((s) => s.showCollision)

  const asset = geom.type === 'mesh' && geom.meshRef ? doc.assets.find((a) => a.name === geom.meshRef) : undefined
  const material = geom.materialRef ? doc.assets.find((a) => a.name === geom.materialRef) : undefined
  const meshGeometry = useMeshGeometry(asset)

  const geometry = useMemo(() => {
    if (geom.type === 'mesh') return meshGeometry
    return buildPrimitiveGeometry(geom)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geom, meshGeometry])

  const quatArray = useMemo((): [number, number, number, number] => {
    const base = reprToThreeQuaternion(geom.rotation, doc.compiler.angle, doc.compiler.eulerseq)
    const q = needsZUpCorrection(geom) ? base.clone().multiply(ZUP_TO_YUP_CORRECTION) : base
    return [q.x, q.y, q.z, q.w]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geom.rotation, geom.type, doc.compiler.angle, doc.compiler.eulerseq])

  const visibleForRole =
    geom.role === 'visual' ? showVisual : geom.role === 'collision' ? showCollision : showVisual || showCollision

  if (!visibleForRole || !geometry) return null

  const color = geom.rgba
    ? new THREE.Color(geom.rgba[0], geom.rgba[1], geom.rgba[2])
    : material?.rgba
      ? new THREE.Color(material.rgba[0], material.rgba[1], material.rgba[2])
      : DEFAULT_COLOR
  const opacity = geom.rgba?.[3] ?? material?.rgba?.[3] ?? 1
  const isCollisionOnly = geom.role === 'collision'
  const scale = geom.type === 'mesh' ? (asset?.scale ?? [1, 1, 1]) : primitiveScale(geom)

  return (
    <mesh
      position={geom.pos}
      quaternion={quatArray}
      scale={scale}
      geometry={geometry}
      castShadow={!isCollisionOnly}
      receiveShadow={!isCollisionOnly}
      userData={{ geomId: geom.id }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <meshStandardMaterial
        color={isSelected ? '#fbbf24' : color}
        transparent={isCollisionOnly || opacity < 1}
        opacity={isCollisionOnly ? 0.3 : opacity}
        wireframe={isCollisionOnly}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  )
}
