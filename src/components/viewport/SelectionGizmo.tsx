import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import { useEditorStore } from '../../state/store'
import { setBodyPos, setBodyRotation } from '../../state/actions/bodyActions'
import { setSitePos, setSiteRotation } from '../../state/actions/siteActions'
import { quatToOrientation, threeToMjQuat } from '../../core/mjcf/rotations'
import { findBody, findSite } from '../../core/mjcf/queries'

function findObjectByUserData(root: THREE.Object3D, key: string, value: string): THREE.Object3D | undefined {
  let found: THREE.Object3D | undefined
  root.traverse((obj) => {
    if (!found && obj.userData?.[key] === value) found = obj
  })
  return found
}

interface SelectionGizmoProps {
  /** Called on drag start/end so the viewport can suspend OrbitControls
   * while the gizmo is being dragged (otherwise dragging a body also orbits
   * the camera, since both listen to the same pointer). */
  onDraggingChange?: (dragging: boolean) => void
}

/**
 * Attaches a drei TransformControls gizmo to the currently selected body or
 * site's live three.js object (found by userData tag, since BodyObject/
 * SiteMarker don't expose refs upward). Writes back through the same store
 * actions the property panel uses, so gizmo drags and typed edits stay in
 * sync — there is only one source of truth (the document).
 */
export function SelectionGizmo({ onDraggingChange }: SelectionGizmoProps) {
  const scene = useThree((s) => s.scene)
  const selection = useEditorStore((s) => s.selection)
  const document = useEditorStore((s) => s.document)
  const revision = useEditorStore((s) => s.revision)
  const gizmoMode = useEditorStore((s) => s.gizmoMode)
  const mutate = useEditorStore((s) => s.mutate)
  const [target, setTarget] = useState<THREE.Object3D | null>(null)

  useEffect(() => {
    if (!selection || (selection.kind !== 'body' && selection.kind !== 'site')) {
      setTarget(null)
      return
    }
    const key = selection.kind === 'body' ? 'bodyId' : 'siteId'
    setTarget(findObjectByUserData(scene, key, selection.id) ?? null)
  }, [scene, selection, revision])

  if (!target || !document || !selection || (selection.kind !== 'body' && selection.kind !== 'site')) {
    return null
  }

  const handleChange = () => {
    const pos: [number, number, number] = [target.position.x, target.position.y, target.position.z]
    if (selection.kind === 'body') {
      const body = findBody(document.worldbody, selection.id)
      if (!body) return
      mutate((doc) => {
        setBodyPos(doc, selection.id, pos)
        if (gizmoMode === 'rotate') {
          const mjQuat = threeToMjQuat(target.quaternion)
          const repr = quatToOrientation(mjQuat, doc.compiler.angle, doc.compiler.eulerseq, body.rotation.kind)
          setBodyRotation(doc, selection.id, repr)
        }
      })
    } else {
      const site = findSite(document.worldbody, selection.id)
      if (!site) return
      mutate((doc) => {
        setSitePos(doc, selection.id, pos)
        if (gizmoMode === 'rotate') {
          const mjQuat = threeToMjQuat(target.quaternion)
          const repr = quatToOrientation(mjQuat, doc.compiler.angle, doc.compiler.eulerseq, site.rotation.kind)
          setSiteRotation(doc, selection.id, repr)
        }
      })
    }
  }

  return (
    <TransformControls
      object={target}
      mode={gizmoMode === 'rotate' ? 'rotate' : 'translate'}
      onObjectChange={handleChange}
      onMouseDown={() => onDraggingChange?.(true)}
      onMouseUp={() => onDraggingChange?.(false)}
      space="local"
    />
  )
}
