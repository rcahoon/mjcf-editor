import { useEditorStore } from '../../state/store'
import { deleteJoint, setJointField } from '../../state/actions/jointActions'
import type { JointNode, JointType } from '../../core/mjcf/types'
import { TextField } from './fields/TextField'
import { Vec3Field } from './fields/Vec3Field'
import { NumberField } from './fields/NumberField'
import { RangeField } from './fields/RangeField'
import { EnumSelect } from './fields/EnumSelect'

const JOINT_TYPES: JointType[] = ['hinge', 'slide', 'ball', 'free']

export function JointProperties({ joint }: { joint: JointNode }) {
  const mutate = useEditorStore((s) => s.mutate)
  const select = useEditorStore((s) => s.select)
  const previewValue = useEditorStore((s) => s.jointPreview[joint.id] ?? 0)
  const setJointPreview = useEditorStore((s) => s.setJointPreview)
  const clearJointPreview = useEditorStore((s) => s.clearJointPreview)

  const canPreview = joint.type === 'hinge' || joint.type === 'slide'
  const [rangeMin, rangeMax] = joint.range ?? (joint.type === 'hinge' ? [-180, 180] : [-1, 1])

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-neutral-200">Joint</h3>
      <TextField
        label="Name"
        value={joint.name ?? ''}
        onCommit={(name) => mutate((d) => setJointField(d, joint.id, { name }))}
      />
      <EnumSelect
        label="Type"
        value={joint.type}
        options={JOINT_TYPES}
        onCommit={(type) => mutate((d) => setJointField(d, joint.id, { type }))}
      />
      {joint.type !== 'free' && (
        <>
          <Vec3Field label="Pos" value={joint.pos} onCommit={(pos) => mutate((d) => setJointField(d, joint.id, { pos }))} />
          {joint.type !== 'ball' && (
            <Vec3Field
              label="Axis"
              value={joint.axis}
              onCommit={(axis) => mutate((d) => setJointField(d, joint.id, { axis }))}
            />
          )}
          <RangeField
            label="Range"
            value={joint.range ?? [rangeMin, rangeMax]}
            onCommit={(range) => mutate((d) => setJointField(d, joint.id, { range }))}
          />
          <NumberField
            label="Damping"
            value={joint.damping ?? 0}
            onCommit={(damping) => mutate((d) => setJointField(d, joint.id, { damping }))}
          />
        </>
      )}

      {canPreview && (
        <div className="space-y-1 rounded border border-neutral-800 p-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Pose preview</span>
            <span>{previewValue.toFixed(2)}</span>
          </div>
          <input
            type="range"
            className="w-full"
            min={rangeMin}
            max={rangeMax}
            step={(rangeMax - rangeMin) / 200 || 0.01}
            value={previewValue}
            onChange={(e) => setJointPreview(joint.id, Number(e.target.value))}
          />
          <p className="text-[11px] text-neutral-500">
            Preview only — a visual pose check, not a physics simulation. Not saved on export.
          </p>
          <button
            type="button"
            className="rounded bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-300 hover:bg-neutral-700"
            onClick={() => clearJointPreview(joint.id)}
          >
            Reset preview
          </button>
        </div>
      )}

      <button
        type="button"
        className="rounded bg-red-900/40 px-2 py-1 text-xs text-red-300 hover:bg-red-900/60"
        onClick={() => {
          mutate((d) => deleteJoint(d, joint.id))
          select(null)
        }}
      >
        Delete joint
      </button>
    </div>
  )
}
