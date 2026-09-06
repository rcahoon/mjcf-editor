import { useEditorStore } from '../state/store'
import { findBody, findGeom, findJoint, findSite } from '../core/mjcf/queries'
import type { ActuatorEntry, BodyNode, GeomNode, JointNode, SensorEntry, SiteNode } from '../core/mjcf/types'

export type SelectedEntity =
  | { kind: 'body'; node: BodyNode }
  | { kind: 'joint'; node: JointNode }
  | { kind: 'geom'; node: GeomNode }
  | { kind: 'site'; node: SiteNode }
  | { kind: 'actuator'; node: ActuatorEntry }
  | { kind: 'sensor'; node: SensorEntry }

/** Resolves the current selection to its live typed node, re-evaluating
 * whenever the document is mutated (tracked via `revision`, since the
 * document graph is mutated in place rather than replaced). */
export function useSelectedEntity(): SelectedEntity | null {
  const document = useEditorStore((s) => s.document)
  const selection = useEditorStore((s) => s.selection)
  useEditorStore((s) => s.revision)

  if (!document || !selection) return null
  switch (selection.kind) {
    case 'body': {
      const node = findBody(document.worldbody, selection.id)
      return node ? { kind: 'body', node } : null
    }
    case 'joint': {
      const node = findJoint(document.worldbody, selection.id)
      return node ? { kind: 'joint', node } : null
    }
    case 'geom': {
      const node = findGeom(document.worldbody, selection.id)
      return node ? { kind: 'geom', node } : null
    }
    case 'site': {
      const node = findSite(document.worldbody, selection.id)
      return node ? { kind: 'site', node } : null
    }
    case 'actuator': {
      const node = document.actuators.find((a) => a.id === selection.id)
      return node ? { kind: 'actuator', node } : null
    }
    case 'sensor': {
      const node = document.sensors.find((s) => s.id === selection.id)
      return node ? { kind: 'sensor', node } : null
    }
  }
}
