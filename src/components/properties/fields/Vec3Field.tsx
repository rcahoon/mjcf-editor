import { useEffect, useState } from 'react'
import type { Vec3 } from '../../../core/mjcf/types'

interface Vec3FieldProps {
  label: string
  value: Vec3
  onCommit: (value: Vec3) => void
  step?: number
}

const AXIS_LABELS = ['X', 'Y', 'Z']

export function Vec3Field({ label, value, onCommit, step = 0.01 }: Vec3FieldProps) {
  const [text, setText] = useState<[string, string, string]>([
    String(value[0]),
    String(value[1]),
    String(value[2]),
  ])

  useEffect(() => {
    setText([String(value[0]), String(value[1]), String(value[2])])
  }, [value])

  const commit = (index: number, raw: string) => {
    const n = Number(raw)
    if (!Number.isFinite(n)) {
      setText((t) => {
        const copy = [...t] as [string, string, string]
        copy[index] = String(value[index])
        return copy
      })
      return
    }
    const next: Vec3 = [...value]
    next[index] = n
    onCommit(next)
  }

  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-neutral-400">{label}</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <input
            key={i}
            aria-label={`${label} ${AXIS_LABELS[i]}`}
            type="number"
            step={step}
            className="w-16 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-right text-neutral-100 focus:border-sky-500 focus:outline-none"
            value={text[i]}
            onChange={(e) =>
              setText((t) => {
                const copy = [...t] as [string, string, string]
                copy[i] = e.target.value
                return copy
              })
            }
            onBlur={(e) => commit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
          />
        ))}
      </div>
    </div>
  )
}
