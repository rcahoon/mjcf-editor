import { useEditorStore } from '../../state/store'
import { deleteSite, setSiteField } from '../../state/actions/siteActions'
import type { SiteNode } from '../../core/mjcf/types'
import { TextField } from './fields/TextField'
import { Vec3Field } from './fields/Vec3Field'
import { NumberField } from './fields/NumberField'

export function SiteProperties({ site }: { site: SiteNode }) {
  const mutate = useEditorStore((s) => s.mutate)
  const select = useEditorStore((s) => s.select)

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-neutral-200">Site</h3>
      <TextField label="Name" value={site.name ?? ''} onCommit={(name) => mutate((d) => setSiteField(d, site.id, { name }))} />
      <Vec3Field label="Position" value={site.pos} onCommit={(pos) => mutate((d) => setSiteField(d, site.id, { pos }))} />
      <NumberField
        label="Marker size"
        value={site.size[0] ?? 0.01}
        step={0.001}
        onCommit={(v) => mutate((d) => setSiteField(d, site.id, { size: [v] }))}
      />
      <button
        type="button"
        className="rounded bg-red-900/40 px-2 py-1 text-xs text-red-300 hover:bg-red-900/60"
        onClick={() => {
          mutate((d) => deleteSite(d, site.id))
          select(null)
        }}
      >
        Delete site
      </button>
    </div>
  )
}
