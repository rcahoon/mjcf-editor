import { useState } from 'react'
import { useEditorStore } from '../../state/store'
import { listMechanismTemplates } from '../../core/mechanisms/registry'
import type { MechanismTemplate } from '../../core/mechanisms/types'
import { MechanismCard } from './MechanismCard'
import { InsertMechanismDialog } from './InsertMechanismDialog'

export function MechanismPalette() {
  const document = useEditorStore((s) => s.document)
  const templates = listMechanismTemplates()
  const [activeTemplate, setActiveTemplate] = useState<MechanismTemplate | null>(null)

  const byCategory = new Map<string, MechanismTemplate[]>()
  for (const t of templates) {
    const list = byCategory.get(t.category) ?? []
    list.push(t)
    byCategory.set(t.category, list)
  }

  return (
    <div className="h-full overflow-y-auto p-2">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        FRC mechanism palette
      </h4>
      {!document && <p className="text-xs text-neutral-500">Load a model first to insert mechanisms into it.</p>}
      {document &&
        Array.from(byCategory.entries()).map(([category, list]) => (
          <div key={category} className="mb-3">
            <div className="mb-1 text-[11px] font-medium text-neutral-400">{category}</div>
            <div className="space-y-1.5">
              {list.map((t) => (
                <MechanismCard key={t.id} template={t} onInsert={() => setActiveTemplate(t)} />
              ))}
            </div>
          </div>
        ))}
      {activeTemplate && (
        <InsertMechanismDialog template={activeTemplate} onClose={() => setActiveTemplate(null)} />
      )}
    </div>
  )
}
