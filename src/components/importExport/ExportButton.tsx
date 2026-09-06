import { useEditorStore } from '../../state/store'
import { serializeMjcfDocument } from '../../core/mjcf/serializeMjcf'

export function ExportButton() {
  const document = useEditorStore((s) => s.document)
  const documentName = useEditorStore((s) => s.documentName)
  useEditorStore((s) => s.revision)

  const handleExport = () => {
    if (!document) return
    const xml = serializeMjcfDocument(document)
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const filename = (documentName?.replace(/\.[^.]+$/, '') || document.modelName || 'model') + '.xml'
    const a = window.document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      disabled={!document}
      className="rounded bg-sky-700 px-2 py-1 text-xs text-white hover:bg-sky-600 disabled:opacity-40"
      onClick={handleExport}
    >
      Export .xml
    </button>
  )
}
