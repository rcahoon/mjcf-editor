interface EnumSelectProps<T extends string> {
  label: string
  value: T
  options: readonly T[]
  onCommit: (value: T) => void
}

export function EnumSelect<T extends string>({ label, value, options, onCommit }: EnumSelectProps<T>) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-neutral-400">{label}</span>
      <select
        className="w-32 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-neutral-100 focus:border-sky-500 focus:outline-none"
        value={value}
        onChange={(e) => onCommit(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}
