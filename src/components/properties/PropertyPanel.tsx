import { useEditorStore } from '../../state/store'
import { useSelectedEntity } from '../../hooks/useSelection'
import { addBody } from '../../state/actions/bodyActions'
import { addJoint } from '../../state/actions/jointActions'
import { addGeom } from '../../state/actions/geomActions'
import { addSite } from '../../state/actions/siteActions'
import { addActuator } from '../../state/actions/actuatorActions'
import { addSensor } from '../../state/actions/sensorActions'
import { addDevice } from '../../state/actions/deviceMapActions'
import type { ActuatorKind, SensorKind } from '../../core/mjcf/types'
import { BodyProperties } from './BodyProperties'
import { JointProperties } from './JointProperties'
import { GeomProperties } from './GeomProperties'
import { SiteProperties } from './SiteProperties'
import { ActuatorProperties } from './ActuatorProperties'
import { SensorProperties } from './SensorProperties'
import { DeviceMapEntryProperties } from './DeviceMapEntryProperties'
import { AddWithKindPicker } from './fields/AddWithKindPicker'

const ACTUATOR_KIND_OPTIONS: { value: ActuatorKind; label: string }[] = [
  { value: 'motor', label: 'Motor' },
  { value: 'position', label: 'Position' },
  { value: 'velocity', label: 'Velocity' },
  { value: 'general', label: 'General' },
]

const JOINT_SENSOR_KIND_OPTIONS: { value: SensorKind; label: string }[] = [
  { value: 'jointpos', label: 'Joint position' },
  { value: 'jointvel', label: 'Joint velocity' },
  { value: 'jointactuatorfrc', label: 'Joint actuator force' },
]

const SITE_SENSOR_KIND_OPTIONS: { value: SensorKind; label: string }[] = [
  { value: 'accelerometer', label: 'Accelerometer' },
  { value: 'gyro', label: 'Gyro' },
  { value: 'framepos', label: 'Frame position' },
  { value: 'framequat', label: 'Frame orientation' },
  { value: 'velocimeter', label: 'Velocimeter' },
  { value: 'force', label: 'Force' },
  { value: 'torque', label: 'Torque' },
]

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
      {entity.kind === 'actuator' && <ActuatorProperties actuator={entity.node} />}
      {entity.kind === 'sensor' && <SensorProperties sensor={entity.node} />}
      {entity.kind === 'device' && <DeviceMapEntryProperties device={entity.node} doc={document} />}

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

      {entity.kind === 'body' && (
        <div className="space-y-1 border-t border-neutral-800 pt-2">
          <h4 className="text-xs font-semibold text-neutral-400">Add device to this body</h4>
          {entity.node.name ? (
            <div className="flex flex-wrap gap-1.5">
              <AddButton
                label="IMU device"
                onClick={() =>
                  mutate((d) => {
                    const id = addDevice(d, 'PIGEON', { type: 'body', name: entity.node.name! })
                    select({ kind: 'device', id })
                  })
                }
              />
              <AddButton
                label="Pose device"
                onClick={() =>
                  mutate((d) => {
                    const id = addDevice(d, 'SPECIAL', { type: 'body', name: entity.node.name! })
                    select({ kind: 'device', id })
                  })
                }
              />
            </div>
          ) : (
            <p className="text-[11px] text-neutral-500">Name this body to attach devices to it.</p>
          )}
        </div>
      )}

      {entity.kind === 'joint' && (
        <div className="space-y-2 border-t border-neutral-800 pt-2">
          <h4 className="text-xs font-semibold text-neutral-400">Add to this joint</h4>
          {entity.node.name ? (
            <>
              <AddWithKindPicker
                label="actuator"
                options={ACTUATOR_KIND_OPTIONS}
                onAdd={(kind) =>
                  mutate((d) => {
                    const id = addActuator(d, kind, entity.node.name)
                    select({ kind: 'actuator', id })
                  })
                }
              />
              <AddWithKindPicker
                label="sensor"
                options={JOINT_SENSOR_KIND_OPTIONS}
                onAdd={(kind) =>
                  mutate((d) => {
                    const id = addSensor(d, kind, entity.node.name)
                    select({ kind: 'sensor', id })
                  })
                }
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <AddButton
                  label="Motor device"
                  onClick={() =>
                    mutate((d) => {
                      const id = addDevice(d, 'CTRE_MOTOR', { type: 'joint', name: entity.node.name! })
                      select({ kind: 'device', id })
                    })
                  }
                />
                <AddButton
                  label="Encoder device"
                  onClick={() =>
                    mutate((d) => {
                      const id = addDevice(d, 'CAN_CODER', { type: 'joint', name: entity.node.name! })
                      select({ kind: 'device', id })
                    })
                  }
                />
              </div>
            </>
          ) : (
            <p className="text-[11px] text-neutral-500">Name this joint to attach actuators/sensors/devices to it.</p>
          )}
        </div>
      )}

      {entity.kind === 'site' && (
        <div className="space-y-2 border-t border-neutral-800 pt-2">
          <h4 className="text-xs font-semibold text-neutral-400">Add to this site</h4>
          {entity.node.name ? (
            <AddWithKindPicker
              label="sensor"
              options={SITE_SENSOR_KIND_OPTIONS}
              onAdd={(kind) =>
                mutate((d) => {
                  const id = addSensor(d, kind, entity.node.name)
                  select({ kind: 'sensor', id })
                })
              }
            />
          ) : (
            <p className="text-[11px] text-neutral-500">Name this site to attach sensors to it.</p>
          )}
        </div>
      )}
    </div>
  )
}
