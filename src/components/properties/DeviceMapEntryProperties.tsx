import { useState } from 'react'
import { useEditorStore } from '../../state/store'
import {
  clearDeviceCurrentLimit,
  deleteDevice,
  setDeviceExplicitKind,
  setDeviceField,
  setDeviceIdentity,
} from '../../state/actions/deviceMapActions'
import { DEVICE_KINDS, ID_SPACES, MOTOR_CATALOG, getIdSpaceInfo } from '../../core/deviceMap/idSpaces'
import type { DeviceKind, DeviceMapEntry } from '../../core/deviceMap/types'
import type { MjcfDocument } from '../../core/mjcf/types'
import { NumberField } from './fields/NumberField'

export function DeviceMapEntryProperties({ device, doc }: { device: DeviceMapEntry; doc: MjcfDocument }) {
  const mutate = useEditorStore((s) => s.mutate)
  const select = useEditorStore((s) => s.select)
  const [hasCurrentLimit, setHasCurrentLimit] = useState(device.currentLimit !== undefined)

  const idSpaceInfo = getIdSpaceInfo(device.idSpace)
  const defaultKind = idSpaceInfo?.defaultKind ?? null
  const kindMismatch = device.explicitKind !== undefined && defaultKind !== null && device.explicitKind !== defaultKind

  const targetLine =
    device.resolvedKind === 'motor' || device.resolvedKind === 'encoder'
      ? { label: 'joint', value: device.joint }
      : device.resolvedKind === 'imu' || device.resolvedKind === 'pose'
        ? { label: 'body', value: device.body }
        : { label: device.joint ? 'joint' : device.body ? 'body' : '(none yet)', value: device.joint ?? device.body }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-neutral-200">
        Device {device.idSpace || '?'}.{Number.isNaN(device.deviceId) ? '?' : device.deviceId}
      </h3>

      <label className="flex items-center justify-between gap-2 text-xs">
        <span className="text-neutral-400">ID space</span>
        <select
          className="w-40 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-neutral-100"
          value={device.idSpace}
          onChange={(e) =>
            mutate((d) => setDeviceIdentity(d, device.id, { idSpace: e.target.value, deviceId: device.deviceId }))
          }
        >
          {!idSpaceInfo && <option value={device.idSpace}>{device.idSpace || '(unset)'} (unrecognized)</option>}
          {ID_SPACES.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
              {s.defaultKind ? ` (${s.defaultKind})` : ''}
            </option>
          ))}
        </select>
      </label>

      <NumberField
        label="Device ID"
        value={Number.isNaN(device.deviceId) ? 0 : device.deviceId}
        step={1}
        min={0}
        onCommit={(deviceId) => mutate((d) => setDeviceIdentity(d, device.id, { idSpace: device.idSpace, deviceId }))}
      />

      <label className="flex items-center justify-between gap-2 text-xs">
        <span className="text-neutral-400">Kind</span>
        <select
          className="w-40 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-neutral-100"
          value={device.explicitKind ?? '__default__'}
          onChange={(e) =>
            mutate((d) =>
              setDeviceExplicitKind(
                d,
                device.id,
                e.target.value === '__default__' ? undefined : (e.target.value as DeviceKind),
              ),
            )
          }
        >
          {defaultKind && <option value="__default__">Default ({defaultKind})</option>}
          {DEVICE_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
      {!device.resolvedKind && (
        <p className="text-[11px] text-amber-400">
          {device.idSpace} has no default kind — an explicit kind is required.
        </p>
      )}
      {kindMismatch && (
        <p className="text-[11px] text-amber-400">
          {device.idSpace}'s default kind is {defaultKind}; the robot code type-checks the sensor message it
          receives, so this override will fail at runtime unless the robot code expects it too.
        </p>
      )}

      <p className="text-xs text-neutral-400">
        Target ({targetLine.label}): <span className="text-neutral-200">{targetLine.value || '(unset)'}</span>
      </p>
      <p className="text-[11px] text-neutral-500">Drag this row onto a different joint/body in the tree to retarget it.</p>

      {device.resolvedKind === 'motor' && (
        <>
          <NumberField
            label="Gear"
            value={device.gear ?? 1}
            step={0.1}
            onCommit={(gear) => mutate((d) => setDeviceField(d, device.id, { gear }))}
          />
          <label className="flex items-center justify-between gap-2 text-xs">
            <span className="text-neutral-400">Motor</span>
            <select
              className="w-40 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-neutral-100"
              value={device.motor ?? 'KrakenX60'}
              onChange={(e) => mutate((d) => setDeviceField(d, device.id, { motor: e.target.value }))}
            >
              {MOTOR_CATALOG.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-neutral-400">
            <input
              type="checkbox"
              checked={hasCurrentLimit}
              onChange={(e) => {
                setHasCurrentLimit(e.target.checked)
                if (!e.target.checked) mutate((d) => clearDeviceCurrentLimit(d, device.id))
              }}
            />
            Current limit
          </label>
          {hasCurrentLimit && (
            <NumberField
              label="Current limit (A)"
              value={device.currentLimit ?? 40}
              step={1}
              min={0}
              onCommit={(currentLimit) => mutate((d) => setDeviceField(d, device.id, { currentLimit }))}
            />
          )}
          <NumberField
            label="Efficiency"
            value={device.efficiency ?? 1}
            step={0.05}
            min={0}
            max={1}
            onCommit={(efficiency) => mutate((d) => setDeviceField(d, device.id, { efficiency }))}
          />
          <label className="flex items-center justify-between gap-2 text-xs">
            <span className="text-neutral-400">Actuator</span>
            <select
              className="w-40 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-neutral-100"
              value={device.actuator ?? ''}
              onChange={(e) => mutate((d) => setDeviceField(d, device.id, { actuator: e.target.value }))}
            >
              <option value="">(auto-resolve)</option>
              {doc.actuators
                .filter((a) => a.name)
                .map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
            </select>
          </label>
          <p className="text-[11px] text-neutral-500">
            Auto-resolve requires exactly one actuator targeting this device's joint.
          </p>
        </>
      )}

      {device.resolvedKind === 'encoder' && (
        <>
          <NumberField
            label="Gear"
            value={device.gear ?? 1}
            step={0.1}
            onCommit={(gear) => mutate((d) => setDeviceField(d, device.id, { gear }))}
          />
          <NumberField
            label="Ticks/revolution"
            value={device.ticksPerRevolution ?? 2048}
            step={1}
            onCommit={(ticksPerRevolution) => mutate((d) => setDeviceField(d, device.id, { ticksPerRevolution }))}
          />
        </>
      )}

      <button
        type="button"
        className="rounded bg-red-900/40 px-2 py-1 text-xs text-red-300 hover:bg-red-900/60"
        onClick={() => {
          mutate((d) => deleteDevice(d, device.id))
          select(null)
        }}
      >
        Delete device
      </button>
    </div>
  )
}
