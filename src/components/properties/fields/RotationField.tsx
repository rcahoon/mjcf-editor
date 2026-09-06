import { orientationToQuat, quatToOrientation } from '../../../core/mjcf/rotations'
import type { RotationRepr } from '../../../core/mjcf/types'
import { EnumSelect } from './EnumSelect'
import { NumberField } from './NumberField'
import { Vec3Field } from './Vec3Field'

interface RotationFieldProps {
  rotation: RotationRepr
  angleUnits: 'degree' | 'radian'
  eulerseq: string
  onCommit: (rotation: RotationRepr) => void
}

const KINDS: RotationRepr['kind'][] = ['quat', 'euler', 'axisangle', 'xyaxes', 'zaxis']

export function RotationField({ rotation, angleUnits, eulerseq, onCommit }: RotationFieldProps) {
  const changeKind = (kind: RotationRepr['kind']) => {
    const quat = orientationToQuat(rotation, angleUnits, eulerseq)
    onCommit(quatToOrientation(quat, angleUnits, eulerseq, kind))
  }

  return (
    <div className="space-y-1 rounded border border-neutral-800 p-1.5">
      <EnumSelect label="Rotation" value={rotation.kind} options={KINDS} onCommit={changeKind} />
      {rotation.kind === 'quat' && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-neutral-400">w x y z</span>
          <div className="flex gap-1">
            {(['w', 'x', 'y', 'z'] as const).map((label, i) => (
              <input
                key={label}
                aria-label={label}
                type="number"
                step={0.01}
                className="w-14 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-right text-neutral-100"
                defaultValue={rotation.quat[i]}
                onBlur={(e) => {
                  const n = Number(e.target.value)
                  if (!Number.isFinite(n)) return
                  const next = [...rotation.quat] as typeof rotation.quat
                  next[i] = n
                  onCommit({ kind: 'quat', quat: next })
                }}
              />
            ))}
          </div>
        </div>
      )}
      {rotation.kind === 'euler' && (
        <Vec3Field
          label={`Euler (${angleUnits}, ${eulerseq})`}
          value={rotation.euler}
          onCommit={(euler) => onCommit({ kind: 'euler', euler })}
        />
      )}
      {rotation.kind === 'axisangle' && (
        <>
          <Vec3Field label="Axis" value={rotation.axis} onCommit={(axis) => onCommit({ ...rotation, axis })} />
          <NumberField
            label={`Angle (${angleUnits})`}
            value={rotation.angle}
            onCommit={(angle) => onCommit({ ...rotation, angle })}
          />
        </>
      )}
      {rotation.kind === 'xyaxes' && (
        <>
          <Vec3Field label="X axis" value={rotation.xaxis} onCommit={(xaxis) => onCommit({ ...rotation, xaxis })} />
          <Vec3Field label="Y axis" value={rotation.yaxis} onCommit={(yaxis) => onCommit({ ...rotation, yaxis })} />
        </>
      )}
      {rotation.kind === 'zaxis' && (
        <Vec3Field label="Z axis" value={rotation.zaxis} onCommit={(zaxis) => onCommit({ kind: 'zaxis', zaxis })} />
      )}
    </div>
  )
}
