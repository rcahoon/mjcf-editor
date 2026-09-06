import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { loadMeshGeometry } from '../../core/geometry/loadMesh'
import type { AssetEntry, GeomNode } from '../../core/mjcf/types'

/** A fixed correction applied to cylinder/capsule/plane primitives: MJCF
 * orients these along local Z by default, while three.js's built-in
 * geometries for the same shapes are authored along local Y. */
export const ZUP_TO_YUP_CORRECTION = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(Math.PI / 2, 0, 0),
)

export function useMeshGeometry(asset: AssetEntry | undefined): THREE.BufferGeometry | null {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const url = asset?.resolvedUrl

  useEffect(() => {
    if (!url) {
      setGeometry(null)
      return
    }
    let cancelled = false
    loadMeshGeometry(url, asset?.file).then((geo) => {
      if (!cancelled) setGeometry(geo)
    })
    return () => {
      cancelled = true
    }
  }, [url, asset?.file])

  return geometry
}

/** Builds the primitive three.js geometry for a non-mesh GeomNode, honoring
 * MJCF's size semantics (which differ from three.js's own constructor args
 * for the same shape — e.g. box `size` is half-extents, not full extents). */
export function buildPrimitiveGeometry(geom: GeomNode): THREE.BufferGeometry {
  const [a = 0.1, b = 0.1, c = 0.1] = geom.size
  switch (geom.type) {
    case 'box':
      return new THREE.BoxGeometry(a * 2, b * 2, c * 2)
    case 'sphere':
      return new THREE.SphereGeometry(a, 24, 16)
    case 'cylinder':
      return new THREE.CylinderGeometry(a, a, b * 2, 24)
    case 'capsule':
      return new THREE.CapsuleGeometry(a, b * 2, 8, 16)
    case 'ellipsoid':
      return new THREE.SphereGeometry(1, 24, 16)
    case 'plane':
      return new THREE.PlaneGeometry(a > 0 ? a * 2 : 10, b > 0 ? b * 2 : 10)
    default:
      return new THREE.BoxGeometry(a * 2, b * 2, c * 2)
  }
}

/** Ellipsoid needs non-uniform scale on top of a unit sphere; other
 * primitives render at their natural size already. */
export function primitiveScale(geom: GeomNode): [number, number, number] {
  if (geom.type === 'ellipsoid') {
    const [a = 0.1, b = 0.1, c = 0.1] = geom.size
    return [a, b, c]
  }
  return [1, 1, 1]
}

export function needsZUpCorrection(geom: GeomNode): boolean {
  return geom.type === 'cylinder' || geom.type === 'capsule'
}
