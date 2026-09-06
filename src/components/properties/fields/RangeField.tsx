import { NumberField } from './NumberField'

interface RangeFieldProps {
  label: string
  value: [number, number]
  onCommit: (value: [number, number]) => void
  step?: number
}

export function RangeField({ label, value, onCommit, step = 1 }: RangeFieldProps) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-neutral-400">{label}</span>
      <div className="flex gap-1">
        <NumberField label="" value={value[0]} step={step} onCommit={(min) => onCommit([min, value[1]])} />
        <NumberField label="" value={value[1]} step={step} onCommit={(max) => onCommit([value[0], max])} />
      </div>
    </div>
  )
}
