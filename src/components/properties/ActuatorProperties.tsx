import { useEditorStore } from '../../state/store'
import { deleteActuator, setActuatorField, setActuatorTarget } from '../../state/actions/actuatorActions'
import { collectAllJoints, collectAllSites } from '../../core/mjcf/queries'
import type { ActuatorEntry, MjcfDocument } from '../../core/mjcf/types'
import { TextField } from './fields/TextField'
import { NumberField } from './fields/NumberField'
import { RangeField } from './fields/RangeField'

export function ActuatorProperties({ actuator, doc }: { actuator: ActuatorEntry; doc: MjcfDocument }) {
  const mutate = useEditorStore((s) => s.mutate)
  const select = useEditorStore((s) => s.select)
  const joints = collectAllJoints(doc.worldbody).filter((j) => j.name)
  const sites = collectAllSites(doc.worldbody).filter((s) => s.name)
  const options = actuator.target.type === 'joint' ? joints.map((j) => j.name!) : sites.map((s) => s.name!)

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-neutral-200">Actuator ({actuator.kind})</h3>
      <TextField
        label="Name"
        value={actuator.name ?? ''}
        onCommit={(name) => mutate((d) => setActuatorField(d, actuator.id, { name }))}
      />
      <label className="flex items-center justify-between gap-2 text-xs">
        <span className="text-neutral-400">Target type</span>
        <select
          className="w-32 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-neutral-100"
          value={actuator.target.type}
          onChange={(e) =>
            mutate((d) => setActuatorTarget(d, actuator.id, { type: e.target.value as 'joint' | 'site', name: '' }))
          }
        >
          <option value="joint">joint</option>
          <option value="site">site</option>
        </select>
      </label>
      <label className="flex items-center justify-between gap-2 text-xs">
        <span className="text-neutral-400">Target</span>
        <select
          className="w-32 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-neutral-100"
          value={actuator.target.name}
          onChange={(e) =>
            mutate((d) => setActuatorTarget(d, actuator.id, { type: actuator.target.type, name: e.target.value }))
          }
        >
          <option value="">(unset)</option>
          {options.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

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
