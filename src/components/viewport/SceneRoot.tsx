import { useEditorStore } from '../../state/store'
import type { MjcfDocument } from '../../core/mjcf/types'
import { BodyObject } from './BodyObject'
import { GeomMesh } from './GeomMesh'

export function SceneRoot({ doc }: { doc: MjcfDocument }) {
  const selection = useEditorStore((s) => s.selection)
  const select = useEditorStore((s) => s.select)

  return (
    <>
      {/* worldbody itself can carry geoms directly (e.g. a ground plane). */}
      {doc.worldbody.geoms.map((g) => (
        <GeomMesh
          key={g.id}
          geom={g}
          doc={doc}
          isSelected={selection?.kind === 'geom' && selection.id === g.id}
          onSelect={() => select({ kind: 'geom', id: g.id })}
        />
      ))}
      {doc.worldbody.children.map((body) => (
        <BodyObject key={body.id} body={body} doc={doc} />
      ))}
    </>
  )
}
