import { useMemo } from 'react'
import { Tree } from 'react-arborist'
import { useEditorStore } from '../../state/store'
import { useElementSize } from '../../hooks/useElementSize'
import { findBody, findJoint, findSite } from '../../core/mjcf/queries'
import { setActuatorTarget } from '../../state/actions/actuatorActions'
import { moveSensorToTarget } from '../../state/actions/sensorActions'
import { setDeviceTarget } from '../../state/actions/deviceMapActions'
import { buildTreeData, checkTreeDrop } from './treeData'
import { TreeNodeRenderer } from './TreeNodeRenderer'

const DRAGGABLE_KINDS = new Set(['actuator', 'sensor', 'device'])

export function HierarchyTree() {
  const document = useEditorStore((s) => s.document)
  const revision = useEditorStore((s) => s.revision)
  const selection = useEditorStore((s) => s.selection)
  const select = useEditorStore((s) => s.select)
  const mutate = useEditorStore((s) => s.mutate)
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
          disableDrag={(data) => !DRAGGABLE_KINDS.has(data.selection?.kind ?? '')}
          disableDrop={({ parentNode, dragNodes }) => {
            const compat = checkTreeDrop(document, dragNodes[0]?.data.selection, parentNode.data.selection)
            return compat !== 'valid'
          }}
          onMove={({ dragNodes, parentNode }) => {
            const dragSelection = dragNodes[0]?.data.selection
            const targetSelection = parentNode?.data.selection
            if (!dragSelection || !targetSelection) return

            if (dragSelection.kind === 'device') {
              if (targetSelection.kind !== 'joint' && targetSelection.kind !== 'body') return
              const targetType: 'joint' | 'body' = targetSelection.kind
              const targetName =
                targetType === 'joint'
                  ? findJoint(document.worldbody, targetSelection.id)?.name
                  : findBody(document.worldbody, targetSelection.id)?.name
              if (!targetName) return
              mutate((doc) => setDeviceTarget(doc, dragSelection.id, { type: targetType, name: targetName }))
              return
            }

            if (targetSelection.kind !== 'joint' && targetSelection.kind !== 'site') return
            const targetType: 'joint' | 'site' = targetSelection.kind
            const targetName =
              targetType === 'joint'
                ? findJoint(document.worldbody, targetSelection.id)?.name
                : findSite(document.worldbody, targetSelection.id)?.name
            if (!targetName) return

            mutate((doc) => {
              if (dragSelection.kind === 'actuator') {
                setActuatorTarget(doc, dragSelection.id, { type: targetType, name: targetName })
              } else if (dragSelection.kind === 'sensor') {
                const newId = moveSensorToTarget(doc, dragSelection.id, {
                  type: targetType,
                  name: targetName,
                })
                if (newId && newId !== dragSelection.id) select({ kind: 'sensor', id: newId })
              }
            })
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
