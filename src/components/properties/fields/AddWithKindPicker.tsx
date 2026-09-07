import { useState } from 'react'

interface Option<T extends string> {
  value: T
  label: string
}

interface AddWithKindPickerProps<T extends string> {
  /** What's being added, e.g. "actuator" or "sensor" — used in the button label. */
  label: string
  options: readonly Option<T>[]
  onAdd: (kind: T) => void
}

/** A kind dropdown paired with a single "+ Add" button — used where the
 * thing being created has a kind fixed at creation time (an actuator's or
 * sensor's kind is the XML tag itself, not an editable attribute), so the
 * kind must be chosen up front rather than defaulted and changed later. */
export function AddWithKindPicker<T extends string>({ label, options, onAdd }: AddWithKindPickerProps<T>) {
  const [kind, setKind] = useState<T>(options[0].value)

  return (
    <div className="flex items-center gap-1.5">
      <select
        className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-800 px-1 py-1 text-xs text-neutral-300 focus:border-sky-500 focus:outline-none"
        value={kind}
        onChange={(e) => setKind(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="shrink-0 rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700"
        onClick={() => onAdd(kind)}
      >
        + Add {label}
      </button>
    </div>
  )
}
