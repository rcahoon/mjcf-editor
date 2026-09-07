import { useEditorStore } from '../../state/store'
import { deleteActuator, setActuatorField } from '../../state/actions/actuatorActions'
import type { ActuatorEntry } from '../../core/mjcf/types'
import { TextField } from './fields/TextField'
import { NumberField } from './fields/NumberField'
import { RangeField } from './fields/RangeField'

export function ActuatorProperties({ actuator }: { actuator: ActuatorEntry }) {
  const mutate = useEditorStore((s) => s.mutate)
  const select = useEditorStore((s) => s.select)

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-neutral-200">Actuator ({actuator.kind})</h3>
      <TextField
        label="Name"
        value={actuator.name ?? ''}
        onCommit={(name) => mutate((d) => setActuatorField(d, actuator.id, { name }))}
      />
      <p className="text-xs text-neutral-400">
        Target: <span className="text-neutral-200">{actuator.target.name || '(unset)'}</span> ({actuator.target.type})
      </p>
      <p className="text-[11px] text-neutral-500">Drag this row onto a different joint/site in the tree to retarget it.</p>

      {actuator.kind === 'motor' && (
        <NumberField label="Gear" value={actuator.gear ?? 1} onCommit={(gear) => mutate((d) => setActuatorField(d, actuator.id, { gear }))} />
      )}
      {actuator.kind === 'position' && (
        <NumberField label="Kp" value={actuator.kp ?? 1} onCommit={(kp) => mutate((d) => setActuatorField(d, actuator.id, { kp }))} />
      )}
      {actuator.kind === 'velocity' && (
        <NumberField label="Kv" value={actuator.kv ?? 1} onCommit={(kv) => mutate((d) => setActuatorField(d, actuator.id, { kv }))} />
      )}
      <RangeField
        label="Ctrl range"
        value={actuator.ctrlrange ?? [-1, 1]}
        step={0.01}
        onCommit={(ctrlrange) => mutate((d) => setActuatorField(d, actuator.id, { ctrlrange }))}
      />
      <RangeField
        label="Force range"
        value={actuator.forcerange ?? [0, 0]}
        step={1}
        onCommit={(forcerange) => mutate((d) => setActuatorField(d, actuator.id, { forcerange }))}
      />

      <button
        type="button"
        className="rounded bg-red-900/40 px-2 py-1 text-xs text-red-300 hover:bg-red-900/60"
        onClick={() => {
          mutate((d) => deleteActuator(d, actuator.id))
          select(null)
        }}
      >
        Delete actuator
      </button>
    </div>
  )
}
