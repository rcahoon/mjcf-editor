import { useEditorStore } from '../../state/store'
import { ImportControls } from '../importExport/ImportControls'
import { ExportButton } from '../importExport/ExportButton'

export function Toolbar() {
  const document = useEditorStore((s) => s.document)
  const showVisual = useEditorStore((s) => s.showVisual)
  const showCollision = useEditorStore((s) => s.showCollision)
  const setShowVisual = useEditorStore((s) => s.setShowVisual)
  const setShowCollision = useEditorStore((s) => s.setShowCollision)
  const gizmoMode = useEditorStore((s) => s.gizmoMode)
  const setGizmoMode = useEditorStore((s) => s.setGizmoMode)

  return (
    <div className="flex items-center gap-3 border-b border-neutral-800 bg-neutral-900 px-3 py-2">
      <span className="text-sm font-semibold text-neutral-100">MJCF Editor</span>
      {document && <span className="text-xs text-neutral-500">{document.modelName}</span>}
      <div className="ml-2 flex-1" />
      {document && (
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={showVisual} onChange={(e) => setShowVisual(e.target.checked)} />
            Visual
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={showCollision} onChange={(e) => setShowCollision(e.target.checked)} />
            Collision
          </label>
          <div className="flex overflow-hidden rounded border border-neutral-700">
            <button
              type="button"
              className={`px-2 py-0.5 ${gizmoMode === 'translate' ? 'bg-sky-700 text-white' : 'bg-neutral-800 text-neutral-300'}`}
              onClick={() => setGizmoMode('translate')}
            >
              Move
            </button>
            <button
              type="button"
              className={`px-2 py-0.5 ${gizmoMode === 'rotate' ? 'bg-sky-700 text-white' : 'bg-neutral-800 text-neutral-300'}`}
              onClick={() => setGizmoMode('rotate')}
            >
              Rotate
            </button>
          </div>
        </div>
      )}
      <ImportControls />
      <ExportButton />
    </div>
  )
}
