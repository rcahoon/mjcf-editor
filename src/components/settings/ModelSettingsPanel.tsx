import { useMemo, useState } from 'react'
import { useEditorStore } from '../../state/store'
import {
  addKeyframeFromCurrentPose,
  setCompilerAngle,
  setCompilerEulerseq,
  setGravity,
  setTimestep,
} from '../../state/actions/settingsActions'
import { listKeyframeNames } from '../../core/mjcf/keyframes'
import { Vec3Field } from '../properties/fields/Vec3Field'
import { TextField } from '../properties/fields/TextField'
import { EnumSelect } from '../properties/fields/EnumSelect'

function timestepOptions(controlPeriod: number): number[] {
  const options: number[] = []
  for (let n = 1; n <= 16; n++) {
    options.push(Math.round((controlPeriod / n) * 1e9) / 1e9)
  }
  return options
}

export function ModelSettingsPanel() {
  const document = useEditorStore((s) => s.document)
  const revision = useEditorStore((s) => s.revision)
  const controlPeriod = useEditorStore((s) => s.controlPeriod)
  const setControlPeriod = useEditorStore((s) => s.setControlPeriod)
  const jointPreview = useEditorStore((s) => s.jointPreview)
  const mutate = useEditorStore((s) => s.mutate)
  const [keyframeName, setKeyframeName] = useState('pose')

  const keyframeNames = useMemo(() => (document ? listKeyframeNames(document) : []), [document, revision])

  if (!document) {
    return <div className="p-3 text-sm text-neutral-500">No model loaded.</div>
  }

  const options = timestepOptions(controlPeriod)
  const currentTimestep = document.option.timestep
  const optionSet = new Set(options)
  const timestepChoices =
    currentTimestep !== undefined && !optionSet.has(currentTimestep) ? [...options, currentTimestep] : options

  return (
    <div className="space-y-4 p-3">
      <section className="space-y-2">
        <h4 className="text-xs font-semibold text-neutral-400">Compiler</h4>
        <EnumSelect
          label="Angle units"
          value={document.compiler.angle}
          options={['degree', 'radian'] as const}
          onCommit={(angle) => mutate((d) => setCompilerAngle(d, angle))}
        />
        <TextField
          label="Euler sequence"
          value={document.compiler.eulerseq}
          onCommit={(eulerseq) => mutate((d) => setCompilerEulerseq(d, eulerseq || 'xyz'))}
        />
      </section>

      <section className="space-y-2 border-t border-neutral-800 pt-3">
        <h4 className="text-xs font-semibold text-neutral-400">Option</h4>
        <Vec3Field
          label="Gravity"
          value={document.option.gravity ?? [0, 0, -9.81]}
          step={0.01}
          onCommit={(gravity) => mutate((d) => setGravity(d, gravity))}
        />
        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-neutral-400">Control period (s)</span>
          <input
            type="number"
            step={0.001}
            min={0.0001}
            className="w-24 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-right text-neutral-100"
            value={controlPeriod}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isFinite(n) && n > 0) setControlPeriod(n)
            }}
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-neutral-400">Timestep (s)</span>
          <select
            className="w-32 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-neutral-100"
            value={currentTimestep ?? ''}
            onChange={(e) => mutate((d) => setTimestep(d, Number(e.target.value)))}
          >
            {currentTimestep === undefined && <option value="">(unset)</option>}
            {timestepChoices.map((t) => (
              <option key={t} value={t}>
                {t}
                {!optionSet.has(t) ? ' (current, invalid)' : ''}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[11px] text-neutral-500">
          Every option divides the {controlPeriod}s control period exactly, so simulated and robot time can't drift apart.
        </p>
      </section>

      <section className="space-y-2 border-t border-neutral-800 pt-3">
        <h4 className="text-xs font-semibold text-neutral-400">Keyframes ({keyframeNames.length})</h4>
        {keyframeNames.length === 0 && (
          <p className="text-[11px] text-amber-400">
            No keyframe defined — the simulation resets to MuJoCo's default zero state, which usually has the robot
            interpenetrating the floor.
          </p>
        )}
        <ul className="text-xs text-neutral-300">
          {keyframeNames.map((name) => (
            <li key={name}>• {name}</li>
          ))}
        </ul>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-1 text-xs text-neutral-100"
            value={keyframeName}
            onChange={(e) => setKeyframeName(e.target.value)}
            placeholder="keyframe name"
          />
          <button
            type="button"
            className="shrink-0 rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700"
            onClick={() => mutate((d) => addKeyframeFromCurrentPose(d, jointPreview, keyframeName || 'pose'))}
          >
            + Save current pose as keyframe
          </button>
        </div>
        <p className="text-[11px] text-neutral-500">
          Captures every joint's current pose-preview value (0 if untouched). Ball/free joints are saved at their
          identity/authored pose — the preview slider doesn't drive those.
        </p>
      </section>
    </div>
  )
}
