import { useEditorStore } from '../../state/store'
import { deleteSensor, setSensorName, setSensorTarget } from '../../state/actions/sensorActions'
import { collectAllJoints, collectAllSites } from '../../core/mjcf/queries'
import type { MjcfDocument, SensorEntry } from '../../core/mjcf/types'
import { TextField } from './fields/TextField'

const JOINT_SPACE_KINDS = new Set(['jointpos', 'jointvel', 'jointactuatorfrc'])

export function SensorProperties({ sensor, doc }: { sensor: SensorEntry; doc: MjcfDocument }) {
  const mutate = useEditorStore((s) => s.mutate)
  const select = useEditorStore((s) => s.select)
  const isJointSpace = JOINT_SPACE_KINDS.has(sensor.kind)
  const options = isJointSpace
    ? collectAllJoints(doc.worldbody).filter((j) => j.name).map((j) => j.name!)
    : collectAllSites(doc.worldbody).filter((s) => s.name).map((s) => s.name!)

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-neutral-200">Sensor ({sensor.kind})</h3>
      <TextField label="Name" value={sensor.name ?? ''} onCommit={(name) => mutate((d) => setSensorName(d, sensor.id, name))} />
      <label className="flex items-center justify-between gap-2 text-xs">
        <span className="text-neutral-400">{isJointSpace ? 'Joint' : 'Site'}</span>
        <select
          className="w-32 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-neutral-100"
          value={sensor.target.name}
          onChange={(e) => mutate((d) => setSensorTarget(d, sensor.id, { type: sensor.target.type, name: e.target.value }))}
        >
          <option value="">(unset)</option>
          {options.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      {!isJointSpace && (
        <p className="text-[11px] text-neutral-500">
          This sensor measures at a site's frame — add a site to the body you want to measure if none exists yet.
        </p>
      )}

      <button
        type="button"
        className="rounded bg-red-900/40 px-2 py-1 text-xs text-red-300 hover:bg-red-900/60"
        onClick={() => {
          mutate((d) => deleteSensor(d, sensor.id))
          select(null)
        }}
      >
        Delete sensor
      </button>
    </div>
  )
}
