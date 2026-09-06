import type { MechanismTemplate } from '../../core/mechanisms/types'

export function MechanismCard({ template, onInsert }: { template: MechanismTemplate; onInsert: () => void }) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900/60 p-2">
      <div className="text-xs font-semibold text-neutral-200">{template.name}</div>
      <p className="mt-0.5 text-[11px] text-neutral-500">{template.description}</p>
      <button
        type="button"
        className="mt-1.5 rounded bg-sky-700 px-2 py-0.5 text-[11px] text-white hover:bg-sky-600"
        onClick={onInsert}
      >
        Insert…
      </button>
    </div>
  )
}
