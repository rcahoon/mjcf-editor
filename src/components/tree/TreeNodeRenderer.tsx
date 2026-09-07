import clsx from 'clsx'
import type { NodeRendererProps } from 'react-arborist'
import { useEditorStore } from '../../state/store'
import { checkActuatorSensorDrop, type TreeItem } from './treeData'

export function TreeNodeRenderer({ node, tree, style, dragHandle }: NodeRendererProps<TreeItem>) {
  const document = useEditorStore((s) => s.document)
  const hasChildren = (node.data.children?.length ?? 0) > 0

  // While an actuator/sensor is being dragged, every joint/site row shows
  // whether it's a valid drop target — not just the one currently hovered —
  // so compatible vs. incompatible targets are visible the moment the drag
  // starts (per the requested "reject with visual feedback" UX).
  const dragNode = tree.dragNode
  const dropState =
    dragNode && document ? checkActuatorSensorDrop(document, dragNode.data.selection, node.data.selection) : 'irrelevant'

  const rowClass =
    dropState === 'valid'
      ? node.willReceiveDrop
        ? 'bg-emerald-600/50 text-white ring-1 ring-emerald-400'
        : 'bg-emerald-600/15 text-neutral-200 ring-1 ring-emerald-600/40'
      : dropState === 'invalid'
        ? 'bg-red-950/40 text-neutral-600 cursor-not-allowed'
        : node.isSelected
          ? 'bg-sky-600/40 text-white'
          : 'text-neutral-300 hover:bg-white/5'

  return (
    <div
      ref={dragHandle}
      style={style}
      className={clsx('flex items-center gap-1 truncate rounded px-1 text-[13px] leading-6 cursor-pointer select-none', rowClass)}
      onClick={() => node.data.selection && node.select()}
      onDoubleClick={() => hasChildren && node.toggle()}
    >
      {hasChildren ? (
        <span
          className="w-3 shrink-0 text-center text-neutral-500"
          onClick={(e) => {
            e.stopPropagation()
            node.toggle()
          }}
        >
          {node.isOpen ? '▾' : '▸'}
        </span>
      ) : (
        <span className="w-3 shrink-0" />
      )}
      <span className="truncate">{node.data.label}</span>
    </div>
  )
}
