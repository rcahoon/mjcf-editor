import { useMemo } from 'react'
import { useEditorStore } from '../../state/store'
import { validateMjcfDocument } from '../../core/mjcf/validate'

export function ValidationPanel() {
  const document = useEditorStore((s) => s.document)
  const revision = useEditorStore((s) => s.revision)
  const select = useEditorStore((s) => s.select)

  const issues = useMemo(() => (document ? validateMjcfDocument(document) : []), [document, revision])

  if (!document || issues.length === 0) return null

  return (
    <div className="border-t border-neutral-800 p-2">
      <h4 className="mb-1 text-xs font-semibold text-neutral-400">Validation ({issues.length})</h4>
      <ul className="max-h-32 space-y-1 overflow-y-auto text-[11px]">
        {issues.map((issue, i) => (
          <li
            key={i}
            className={issue.severity === 'error' ? 'text-red-400' : 'text-amber-400'}
            onClick={() => {
              if (!issue.nodeId) return
              const isActuator = document.actuators.some((a) => a.id === issue.nodeId)
              select({ kind: isActuator ? 'actuator' : 'sensor', id: issue.nodeId })
            }}
          >
            {issue.severity === 'error' ? '✕' : '⚠'} {issue.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
