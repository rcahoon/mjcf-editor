import { useEditorStore } from '../../state/store'
import { useSelectedEntity } from '../../hooks/useSelection'
import { addBody } from '../../state/actions/bodyActions'
import { addJoint } from '../../state/actions/jointActions'
import { addGeom } from '../../state/actions/geomActions'
import { addSite } from '../../state/actions/siteActions'
import { BodyProperties } from './BodyProperties'
import { JointProperties } from './JointProperties'
import { GeomProperties } from './GeomProperties'
import { SiteProperties } from './SiteProperties'
import { ActuatorProperties } from './ActuatorProperties'
import { SensorProperties } from './SensorProperties'

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700"
      onClick={onClick}
    >
      + {label}
    </button>
  )
}

export function PropertyPanel() {
  const document = useEditorStore((s) => s.document)
  const mutate = useEditorStore((s) => s.mutate)
  const select = useEditorStore((s) => s.select)
  const entity = useSelectedEntity()

  if (!document) {
    return <div className="p-3 text-sm text-neutral-500">No model loaded.</div>
  }

  if (!entity) {
    return (
      <div className="p-3 text-sm text-neutral-500">
        Select a body, joint, geom, site, actuator, or sensor in the tree or 3D view to edit its properties.
      </div>
    )
  }

  return (
    <div className="space-y-3 p-3">
      {entity.kind === 'body' && <BodyProperties body={entity.node} doc={document} />}
      {entity.kind === 'joint' && <JointProperties joint={entity.node} />}
      {entity.kind === 'geom' && <GeomProperties geom={entity.node} doc={document} />}
      {entity.kind === 'site' && <SiteProperties site={entity.node} />}
      {entity.kind === 'actuator' && <ActuatorProperties actuator={entity.node} doc={document} />}
      {entity.kind === 'sensor' && <SensorProperties sensor={entity.node} doc={document} />}

      {entity.kind === 'body' && (
        <div className="space-y-1 border-t border-neutral-800 pt-2">
          <h4 className="text-xs font-semibold text-neutral-400">Add to this body</h4>
          <div className="flex flex-wrap gap-1.5">
            <AddButton
              label="child body"
              onClick={() =>
                mutate((d) => {
                  const id = addBody(d, entity.node.id, 'new_body')
                  if (id) select({ kind: 'body', id })
                })
              }
            />
            <AddButton
              label="joint"
              onClick={() =>
                mutate((d) => {
                  const id = addJoint(d, entity.node.id)
                  if (id) select({ kind: 'joint', id })
                })
              }
            />
            <AddButton
              label="geom"
              onClick={() =>
                mutate((d) => {
                  const id = addGeom(d, entity.node.id)
                  if (id) select({ kind: 'geom', id })
                })
              }
            />
            <AddButton
              label="site"
              onClick={() =>
                mutate((d) => {
                  const id = addSite(d, entity.node.id, 'new_site')
                  if (id) select({ kind: 'site', id })
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
