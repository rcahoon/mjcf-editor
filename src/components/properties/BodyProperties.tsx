import { useEditorStore } from '../../state/store'
import { setBodyName, setBodyPos, setBodyRotation } from '../../state/actions/bodyActions'
import type { BodyNode, MjcfDocument } from '../../core/mjcf/types'
import { TextField } from './fields/TextField'
import { Vec3Field } from './fields/Vec3Field'
import { RotationField } from './fields/RotationField'

export function BodyProperties({ body, doc }: { body: BodyNode; doc: MjcfDocument }) {
  const mutate = useEditorStore((s) => s.mutate)

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-neutral-200">Body</h3>
      <TextField label="Name" value={body.name ?? ''} onCommit={(name) => mutate((d) => setBodyName(d, body.id, name))} />
      <Vec3Field label="Position" value={body.pos} onCommit={(pos) => mutate((d) => setBodyPos(d, body.id, pos))} />
      <RotationField
        rotation={body.rotation}
        angleUnits={doc.compiler.angle}
        eulerseq={doc.compiler.eulerseq}
        onCommit={(rotation) => mutate((d) => setBodyRotation(d, body.id, rotation))}
      />
      {body.inertial && (
        <div className="space-y-1 rounded border border-neutral-800 p-1.5 text-xs text-neutral-400">
          <div>Inertial: mass {body.inertial.mass.toFixed(3)} kg, com {body.inertial.pos.map((v) => v.toFixed(3)).join(', ')}</div>
        </div>
      )}
      <div className="text-xs text-neutral-500">
        {body.joints.length} joint(s) · {body.geoms.length} geom(s) · {body.sites.length} site(s) · {body.children.length} child bod{body.children.length === 1 ? 'y' : 'ies'}
      </div>
    </div>
  )
}
