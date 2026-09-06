import clsx from 'clsx'
import type { NodeRendererProps } from 'react-arborist'
import type { TreeItem } from './treeData'

export function TreeNodeRenderer({ node, style, dragHandle }: NodeRendererProps<TreeItem>) {
  const hasChildren = (node.data.children?.length ?? 0) > 0
  return (
    <div
      ref={dragHandle}
      style={style}
      className={clsx(
        'flex items-center gap-1 truncate rounded px-1 text-[13px] leading-6 cursor-pointer select-none',
        node.isSelected ? 'bg-sky-600/40 text-white' : 'text-neutral-300 hover:bg-white/5',
      )}
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
