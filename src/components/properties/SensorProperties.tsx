import { useEditorStore } from '../../state/store'
import { deleteSensor, setSensorName } from '../../state/actions/sensorActions'
import type { SensorEntry } from '../../core/mjcf/types'
import { TextField } from './fields/TextField'

export function SensorProperties({ sensor }: { sensor: SensorEntry }) {
  const mutate = useEditorStore((s) => s.mutate)
  const select = useEditorStore((s) => s.select)

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-neutral-200">Sensor ({sensor.kind})</h3>
      <TextField label="Name" value={sensor.name ?? ''} onCommit={(name) => mutate((d) => setSensorName(d, sensor.id, name))} />
      <p className="text-xs text-neutral-400">
        Target: <span className="text-neutral-200">{sensor.target.name || '(unset)'}</span> ({sensor.target.type})
      </p>
      <p className="text-[11px] text-neutral-500">
        Drag this row onto a different joint/site in the tree to retarget it — the sensor kind converts automatically
        when there's a sensible equivalent (e.g. jointpos ↔ framepos), and the drop is rejected otherwise.
      </p>

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
