import { useMemo } from 'react'
import { Tree } from 'react-arborist'
import { useEditorStore } from '../../state/store'
import { useElementSize } from '../../hooks/useElementSize'
import { buildTreeData } from './treeData'
import { TreeNodeRenderer } from './TreeNodeRenderer'

export function HierarchyTree() {
  const document = useEditorStore((s) => s.document)
  const revision = useEditorStore((s) => s.revision)
  const selection = useEditorStore((s) => s.selection)
  const select = useEditorStore((s) => s.select)
  const [containerRef, size] = useElementSize<HTMLDivElement>()

  const data = useMemo(() => (document ? buildTreeData(document) : []), [document, revision])
  const selectedTreeId = selection ? `${selection.kind}:${selection.id}` : undefined

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden">
      {size.height > 0 && document && (
        <Tree
          data={data}
          width={size.width}
          height={size.height}
          rowHeight={24}
          openByDefault
          selection={selectedTreeId}
          onSelect={(nodes) => {
            const first = nodes[0]
            if (first?.data.selection) select(first.data.selection)
          }}
        >
          {TreeNodeRenderer}
        </Tree>
      )}
      {!document && (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-neutral-500">
          No model loaded. Import an MJCF file or load the demo model to get started.
        </div>
      )}
    </div>
  )
}
