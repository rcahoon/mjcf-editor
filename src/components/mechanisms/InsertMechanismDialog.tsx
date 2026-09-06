import { useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useEditorStore } from '../../state/store'
import { collectAllBodies, suggestUniqueName } from '../../core/mjcf/queries'
import { insertMechanismInstance } from '../../core/mechanisms/insert'
import type { MechanismTemplate } from '../../core/mechanisms/types'
import type { NodeId } from '../../core/xml/xmlNode'

interface InsertMechanismDialogProps {
  template: MechanismTemplate
  onClose: () => void
}

export function InsertMechanismDialog({ template, onClose }: InsertMechanismDialogProps) {
  const document = useEditorStore((s) => s.document)
  const mutate = useEditorStore((s) => s.mutate)
  const setMechanismInstance = useEditorStore((s) => s.setMechanismInstance)
  const select = useEditorStore((s) => s.select)

  const bodies = useMemo(() => (document ? collectAllBodies(document.worldbody) : []), [document])
  const existingNames = useMemo(() => {
    const names = new Set<string>()
    for (const b of bodies) if (b.name) names.add(b.name)
    return names
  }, [bodies])

  const [params, setParams] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(template.params.map((p) => [p.key, p.default])),
  )
  const [attachTo, setAttachTo] = useState<NodeId>(document?.worldbody.id ?? '')
  const [instanceName, setInstanceName] = useState(() => suggestUniqueName(template.id, existingNames))

  if (!document) return null

  const handleInsert = () => {
    mutate((doc) => {
      const { instance } = insertMechanismInstance(doc, template.id, params, instanceName, attachTo)
      setMechanismInstance(instance)
      select({ kind: 'body', id: instance.rootBodyIds[0] })
    })
    onClose()
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-neutral-700 bg-neutral-900 p-4 shadow-xl">
          <Dialog.Title className="text-sm font-semibold text-neutral-100">Insert {template.name}</Dialog.Title>
          <p className="mt-1 text-xs text-neutral-500">{template.description}</p>

          <div className="mt-3 space-y-2">
            <label className="flex items-center justify-between gap-2 text-xs">
              <span className="text-neutral-400">Instance name</span>
              <input
                className="w-40 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-neutral-100"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs">
              <span className="text-neutral-400">Attach to body</span>
              <select
                className="w-40 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-neutral-100"
                value={attachTo}
                onChange={(e) => setAttachTo(e.target.value)}
              >
                {bodies.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name ?? (b.id === document.worldbody.id ? 'worldbody' : '(unnamed body)')}
                  </option>
                ))}
              </select>
            </label>

            <div className="max-h-64 space-y-1.5 overflow-y-auto border-t border-neutral-800 pt-2">
              {template.params.map((p) => (
                <label key={p.key} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-neutral-400">{p.label}</span>
                  {p.type === 'enum' ? (
                    <select
                      className="w-32 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-neutral-100"
                      value={String(params[p.key])}
                      onChange={(e) => setParams((s) => ({ ...s, [p.key]: e.target.value }))}
                    >
                      {p.options?.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      step={p.step ?? 0.01}
                      min={p.min}
                      max={p.max}
                      className="w-24 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-right text-neutral-100"
                      value={String(params[p.key])}
                      onChange={(e) => setParams((s) => ({ ...s, [p.key]: Number(e.target.value) }))}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="rounded bg-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-700"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-sky-700 px-3 py-1 text-xs text-white hover:bg-sky-600"
              onClick={handleInsert}
              disabled={!instanceName.trim()}
            >
              Insert
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
