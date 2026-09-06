import { useEditorStore } from '../../state/store'
import { deleteGeom, setGeomField } from '../../state/actions/geomActions'
import type { GeomNode, GeomType, MjcfDocument } from '../../core/mjcf/types'
import { TextField } from './fields/TextField'
import { Vec3Field } from './fields/Vec3Field'
import { EnumSelect } from './fields/EnumSelect'

const GEOM_TYPES: GeomType[] = ['mesh', 'box', 'sphere', 'cylinder', 'capsule', 'plane', 'ellipsoid']
const ROLES = ['visual', 'collision', 'both'] as const

function sizeLabel(type: GeomType): string {
  switch (type) {
    case 'box':
      return 'Half-extents (x y z)'
    case 'sphere':
      return 'Radius'
    case 'cylinder':
      return 'Radius, half-length'
    case 'capsule':
      return 'Radius, half-length'
    case 'ellipsoid':
      return 'Semi-axes (x y z)'
    case 'plane':
      return 'Half-extents (x y, spacing)'
    default:
      return 'Size'
  }
}

export function GeomProperties({ geom, doc }: { geom: GeomNode; doc: MjcfDocument }) {
  const mutate = useEditorStore((s) => s.mutate)
  const select = useEditorStore((s) => s.select)
  const meshOptions = doc.assets.filter((a) => a.kind === 'mesh').map((a) => a.name)
  const materialOptions = doc.assets.filter((a) => a.kind === 'material').map((a) => a.name)

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-neutral-200">Geom</h3>
      <TextField label="Name" value={geom.name ?? ''} onCommit={(name) => mutate((d) => setGeomField(d, geom.id, { name }))} />
      <EnumSelect
        label="Type"
        value={geom.type}
        options={GEOM_TYPES}
        onCommit={(type) => mutate((d) => setGeomField(d, geom.id, { type }))}
      />
      {geom.type === 'mesh' && (
        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-neutral-400">Mesh asset</span>
          <select
            className="w-32 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-neutral-100"
            value={geom.meshRef ?? ''}
            onChange={(e) => mutate((d) => setGeomField(d, geom.id, { meshRef: e.target.value }))}
          >
            <option value="">(none)</option>
            {meshOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
      {geom.type !== 'mesh' && (
        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-neutral-400">{sizeLabel(geom.type)}</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                type="number"
                step={0.005}
                className="w-14 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-right text-neutral-100"
                defaultValue={geom.size[i] ?? 0}
                onBlur={(e) => {
                  const n = Number(e.target.value)
                  if (!Number.isFinite(n)) return
                  const next = [...geom.size]
                  next[i] = n
                  mutate((d) => setGeomField(d, geom.id, { size: next }))
                }}
              />
            ))}
          </div>
        </label>
      )}
      <Vec3Field label="Position" value={geom.pos} onCommit={(pos) => mutate((d) => setGeomField(d, geom.id, { pos }))} />
      <EnumSelect
        label="Role"
        value={geom.role}
        options={ROLES}
        onCommit={(role) => mutate((d) => setGeomField(d, geom.id, { role }))}
      />
      <label className="flex items-center justify-between gap-2 text-xs">
        <span className="text-neutral-400">Material</span>
        <select
          className="w-32 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-neutral-100"
          value={geom.materialRef ?? ''}
          onChange={(e) => mutate((d) => setGeomField(d, geom.id, { materialRef: e.target.value }))}
        >
          <option value="">(none)</option>
          {materialOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="rounded bg-red-900/40 px-2 py-1 text-xs text-red-300 hover:bg-red-900/60"
        onClick={() => {
          mutate((d) => deleteGeom(d, geom.id))
          select(null)
        }}
      >
        Delete geom
      </button>
    </div>
  )
}
