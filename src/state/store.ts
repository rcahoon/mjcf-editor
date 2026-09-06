import { create } from 'zustand'
import type { MjcfDocument } from '../core/mjcf/types'
import type { NodeId } from '../core/xml/xmlNode'
import type { MechanismInstance } from '../core/mechanisms/types'
import type { FileMap } from '../core/assets/resolveAssets'

export type SelectionKind = 'body' | 'joint' | 'geom' | 'site' | 'actuator' | 'sensor'

export interface Selection {
  kind: SelectionKind
  id: NodeId
}

export type GizmoMode = 'translate' | 'rotate'

interface EditorState {
  document: MjcfDocument | null
  documentName: string | null
  selection: Selection | null
  jointPreview: Record<NodeId, number>
  showVisual: boolean
  showCollision: boolean
  gizmoMode: GizmoMode
  mechanismInstances: Record<string, MechanismInstance>
  assetFiles: FileMap
  /** Bumped by every document mutation. The document graph has shared object
   * references between its typed (Layer 1) and raw-XML (Layer 0) views, so it
   * is mutated in place rather than replaced via immutable updates — this
   * counter is what tells subscribed components to re-render. */
  revision: number
}

interface EditorActions {
  loadDocument: (doc: MjcfDocument, name?: string, assetFiles?: FileMap) => void
  select: (selection: Selection | null) => void
  setJointPreview: (jointId: NodeId, value: number) => void
  clearJointPreview: (jointId: NodeId) => void
  setShowVisual: (v: boolean) => void
  setShowCollision: (v: boolean) => void
  setGizmoMode: (mode: GizmoMode) => void
  setMechanismInstance: (instance: MechanismInstance) => void
  removeMechanismInstanceRecord: (instanceId: string) => void
  /** Call after any direct mutation of `document` via core action functions. */
  touch: () => void
  /** Convenience wrapper: runs `fn` against the current document (if any) and
   * bumps revision — the usual way UI code invokes a state/actions/* function. */
  mutate: (fn: (doc: MjcfDocument) => void) => void
}

export type EditorStore = EditorState & EditorActions

export const useEditorStore = create<EditorStore>((set, get) => ({
  document: null,
  documentName: null,
  selection: null,
  jointPreview: {},
  showVisual: true,
  showCollision: true,
  gizmoMode: 'translate',
  mechanismInstances: {},
  assetFiles: new Map(),
  revision: 0,

  loadDocument: (doc, name, assetFiles) =>
    set((s) => ({
      document: doc,
      documentName: name ?? s.documentName,
      selection: null,
      jointPreview: {},
      mechanismInstances: {},
      assetFiles: assetFiles ?? new Map(),
      revision: s.revision + 1,
    })),

  select: (selection) => set({ selection }),

  setJointPreview: (jointId, value) =>
    set((s) => ({ jointPreview: { ...s.jointPreview, [jointId]: value } })),

  clearJointPreview: (jointId) =>
    set((s) => {
      const next = { ...s.jointPreview }
      delete next[jointId]
      return { jointPreview: next }
    }),

  setShowVisual: (v) => set({ showVisual: v }),
  setShowCollision: (v) => set({ showCollision: v }),
  setGizmoMode: (mode) => set({ gizmoMode: mode }),

  setMechanismInstance: (instance) =>
    set((s) => ({ mechanismInstances: { ...s.mechanismInstances, [instance.id]: instance } })),

  removeMechanismInstanceRecord: (instanceId) =>
    set((s) => {
      const next = { ...s.mechanismInstances }
      delete next[instanceId]
      return { mechanismInstances: next }
    }),

  touch: () => set((s) => ({ revision: s.revision + 1 })),

  mutate: (fn) => {
    const doc = get().document
    if (!doc) return
    fn(doc)
    set((s) => ({ revision: s.revision + 1 }))
  },
}))
