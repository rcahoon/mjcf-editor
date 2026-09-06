import { Fragment, type ReactNode, useMemo } from 'react'
import { useEditorStore } from '../../state/store'
import { reprToThreeQuaternion } from '../../core/mjcf/rotations'
import type { BodyNode, JointNode, MjcfDocument, SiteNode } from '../../core/mjcf/types'
import { GeomMesh } from './GeomMesh'
import { JointAxisVisual, axisAngleQuatArray } from './JointGizmoOverlay'

function SiteMarker({ site, isSelected, onSelect }: { site: SiteNode; isSelected: boolean; onSelect: () => void }) {
  const size = site.size[0] ?? 0.01
  return (
    <mesh
      position={site.pos}
      userData={{ siteId: site.id }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <octahedronGeometry args={[Math.max(size, 0.006), 0]} />
      <meshBasicMaterial color={isSelected ? '#fbbf24' : '#f472b6'} wireframe />
    </mesh>
  )
}

interface JointPivotProps {
  joint: JointNode
  previewValue: number
  isSelected: boolean
  onSelectJoint: () => void
  children: ReactNode
}

/** Wraps `children` (everything else in this body) in the joint's motion
 * transform, pivoting/sliding at `joint.pos` along `joint.axis`. Multiple
 * joints on one body nest, one JointPivot per joint, composing in MJCF's
 * documented order. Ball/free joints have no scalar preview (no 1-DOF
 * slider makes sense), so they pass their children through unmodified. */
function JointPivot({ joint, previewValue, isSelected, onSelectJoint, children }: JointPivotProps) {
  const axisVisual = <JointAxisVisual joint={joint} isSelected={isSelected} onSelect={onSelectJoint} />
  const negPos: [number, number, number] = [-joint.pos[0], -joint.pos[1], -joint.pos[2]]

  if (joint.type === 'slide') {
    const t: [number, number, number] = [
      joint.axis[0] * previewValue,
      joint.axis[1] * previewValue,
      joint.axis[2] * previewValue,
    ]
    return (
      <group position={joint.pos}>
        {axisVisual}
        <group position={t}>
          <group position={negPos}>{children}</group>
        </group>
      </group>
    )
  }

  if (joint.type === 'hinge') {
    const q = axisAngleQuatArray(joint.axis, previewValue)
    return (
      <group position={joint.pos}>
        {axisVisual}
        <group quaternion={q}>
          <group position={negPos}>{children}</group>
        </group>
      </group>
    )
  }

  return (
    <Fragment>
      <group position={joint.pos}>{axisVisual}</group>
      {children}
    </Fragment>
  )
}

interface BodyObjectProps {
  body: BodyNode
  doc: MjcfDocument
}

export function BodyObject({ body, doc }: BodyObjectProps) {
  const selection = useEditorStore((s) => s.selection)
  const select = useEditorStore((s) => s.select)
  const jointPreview = useEditorStore((s) => s.jointPreview)

  const quatArray = useMemo((): [number, number, number, number] => {
    const q = reprToThreeQuaternion(body.rotation, doc.compiler.angle, doc.compiler.eulerseq)
    return [q.x, q.y, q.z, q.w]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body.rotation, doc.compiler.angle, doc.compiler.eulerseq])

  let content: ReactNode = (
    <>
      {body.geoms.map((g) => (
        <GeomMesh
          key={g.id}
          geom={g}
          doc={doc}
          isSelected={selection?.kind === 'geom' && selection.id === g.id}
          onSelect={() => select({ kind: 'geom', id: g.id })}
        />
      ))}
      {body.sites.map((s) => (
        <SiteMarker
          key={s.id}
          site={s}
          isSelected={selection?.kind === 'site' && selection.id === s.id}
          onSelect={() => select({ kind: 'site', id: s.id })}
        />
      ))}
      {body.children.map((c) => (
        <BodyObject key={c.id} body={c} doc={doc} />
      ))}
    </>
  )

  for (let i = body.joints.length - 1; i >= 0; i--) {
    const joint = body.joints[i]
    content = (
      <JointPivot
        key={joint.id}
        joint={joint}
        previewValue={jointPreview[joint.id] ?? 0}
        isSelected={selection?.kind === 'joint' && selection.id === joint.id}
        onSelectJoint={() => select({ kind: 'joint', id: joint.id })}
      >
        {content}
      </JointPivot>
    )
  }

  return (
    <group
      position={body.pos}
      quaternion={quatArray}
      onClick={(e) => {
        e.stopPropagation()
        select({ kind: 'body', id: body.id })
      }}
      userData={{ bodyId: body.id }}
    >
      {content}
    </group>
  )
}
