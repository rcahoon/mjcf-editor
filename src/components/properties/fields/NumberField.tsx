import { useEffect, useState } from 'react'

interface NumberFieldProps {
  label: string
  value: number
  onCommit: (value: number) => void
  step?: number
  min?: number
  max?: number
}

export function NumberField({ label, value, onCommit, step = 0.01, min, max }: NumberFieldProps) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    setText(String(value))
  }, [value])

  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-neutral-400">{label}</span>
      <input
        type="number"
        className="w-24 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-right text-neutral-100 focus:border-sky-500 focus:outline-none"
        value={text}
        step={step}
        min={min}
        max={max}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = Number(text)
          if (Number.isFinite(n)) onCommit(n)
          else setText(String(value))
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
    </label>
  )
}
