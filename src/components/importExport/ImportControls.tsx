import { useRef } from 'react'
import { useEditorStore } from '../../state/store'
import { parseMjcfString } from '../../core/mjcf/parseMjcf'
import { resolveAssets } from '../../core/assets/resolveAssets'
import { importFolderFiles } from '../../core/assets/folderImport'
import { importZipFile } from '../../core/assets/zipImport'
import { SAMPLE_FIXTURES } from '../../core/mjcf/sampleFixtures'

export function ImportControls() {
  const loadDocument = useEditorStore((s) => s.loadDocument)
  const xmlInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)

  const handleXmlFile = async (file: File) => {
    const text = await file.text()
    const doc = parseMjcfString(text)
    loadDocument(doc, file.name)
  }

  const handleFolder = async (fileList: FileList) => {
    const { files, xmlText } = await importFolderFiles(fileList)
    const doc = parseMjcfString(xmlText)
    resolveAssets(doc, files)
    loadDocument(doc, 'imported folder', files)
  }

  const handleZip = async (file: File) => {
    const { files, xmlText } = await importZipFile(file)
    const doc = parseMjcfString(xmlText)
    resolveAssets(doc, files)
    loadDocument(doc, file.name, files)
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-1 text-xs text-neutral-200"
        defaultValue=""
        onChange={(e) => {
          const fixture = SAMPLE_FIXTURES.find((f) => f.id === e.target.value)
          if (fixture) loadDocument(parseMjcfString(fixture.xml), fixture.label)
          e.target.value = ''
        }}
      >
        <option value="" disabled>
          Load demo model…
        </option>
        {SAMPLE_FIXTURES.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
        onClick={() => xmlInputRef.current?.click()}
      >
        Import .xml
      </button>
      <input
        ref={xmlInputRef}
        type="file"
        accept=".xml,.mjcf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleXmlFile(file)
          e.target.value = ''
        }}
      />

      <button
        type="button"
        className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
        onClick={() => folderInputRef.current?.click()}
      >
        Import folder
      </button>
      <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        // @ts-expect-error non-standard attributes for folder selection
        webkitdirectory=""
        directory=""
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) void handleFolder(e.target.files)
          e.target.value = ''
        }}
      />

      <button
        type="button"
        className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
        onClick={() => zipInputRef.current?.click()}
      >
        Import .zip
      </button>
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleZip(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
