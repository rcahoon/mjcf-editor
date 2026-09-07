import { makeNodeId, type NodeId } from '../xml/xmlNode'
import { expandInstance } from './namespace'
import { getMechanismTemplate } from './registry'
import type { MechanismInstance } from './types'
import type { MjcfDocument } from '../mjcf/types'
import { findBody } from '../mjcf/queries'
import { getOrCreateTopSection } from '../mjcf/sections'

export interface InsertMechanismResult {
  instance: MechanismInstance
}

/** Expands a template instance and splices its bodies/actuators/sensors/assets
 * into the document at `attachPointBodyId`. Mutates `doc` in place. */
export function insertMechanismInstance(
  doc: MjcfDocument,
  templateId: string,
  params: Record<string, unknown>,
  namespace: string,
  attachPointBodyId: NodeId,
): InsertMechanismResult {
  const template = getMechanismTemplate(templateId)
  if (!template) throw new Error(`Unknown mechanism template "${templateId}"`)
  const attachBody = findBody(doc.worldbody, attachPointBodyId)
  if (!attachBody) throw new Error(`Attach point body "${attachPointBodyId}" not found`)

  const expanded = expandInstance(template, params, namespace)

  attachBody.children.push(...expanded.bodies)
  attachBody.xml.children.push(...expanded.bodies.map((b) => b.xml))

  doc.actuators.push(...expanded.actuators)
  const actuatorSection = getOrCreateTopSection(doc, 'actuator')
  actuatorSection.children.push(...expanded.actuators.map((a) => a.xml))

  doc.sensors.push(...expanded.sensors)
  const sensorSection = getOrCreateTopSection(doc, 'sensor')
  sensorSection.children.push(...expanded.sensors.map((s) => s.xml))

  if (expanded.assets.length > 0) {
    doc.assets.push(...expanded.assets)
    const assetSection = getOrCreateTopSection(doc, 'asset')
    assetSection.children.push(...expanded.assets.map((a) => a.xml))
  }

  if (expanded.devices.length > 0) {
    doc.deviceMap.push(...expanded.devices)
    doc.customSection.children.push(...expanded.devices.map((d) => d.xml))
  }

  for (const b of expanded.bodies) b.mechanismInstanceId = namespace

  const instance: MechanismInstance = {
    id: makeNodeId(),
    templateId,
    instanceName: namespace,
    paramOverrides: params,
    attachPointBodyId,
    rootBodyIds: expanded.bodies.map((b) => b.id),
    deviceIds: expanded.devices.map((d) => d.id),
    linked: true,
  }
  return { instance }
}

/** Re-runs a mechanism instance's template with new params, replacing its
 * previously-materialized subtree. Selection inside the old subtree is not
 * preserved across regeneration (a documented MVP simplification). */
export function updateMechanismInstanceParams(
  doc: MjcfDocument,
  instance: MechanismInstance,
  newParams: Record<string, unknown>,
): InsertMechanismResult {
  removeMechanismInstance(doc, instance)
  return insertMechanismInstance(
    doc,
    instance.templateId,
    newParams,
    instance.instanceName,
    instance.attachPointBodyId,
  )
}

export function removeMechanismInstance(doc: MjcfDocument, instance: MechanismInstance): void {
  const attachBody = findBody(doc.worldbody, instance.attachPointBodyId)
  if (!attachBody) return
  const rootIds = new Set(instance.rootBodyIds)
  const removedXmlIds = new Set(
    attachBody.children.filter((b) => rootIds.has(b.id)).map((b) => b.xml.id),
  )
  attachBody.children = attachBody.children.filter((b) => !rootIds.has(b.id))
  attachBody.xml.children = attachBody.xml.children.filter((c) => !removedXmlIds.has(c.id))

  doc.actuators = doc.actuators.filter((a) => !a.name?.startsWith(`${instance.instanceName}_`))
  doc.sensors = doc.sensors.filter((s) => !s.name?.startsWith(`${instance.instanceName}_`))
  for (const tag of ['actuator', 'sensor'] as const) {
    const section = doc.root.children.find((c) => c.kind === 'element' && c.tag === tag)
    if (section && section.kind === 'element') {
      section.children = section.children.filter(
        (c) => !(c.kind === 'element' && c.attrs.name?.startsWith(`${instance.instanceName}_`)),
      )
    }
  }

  const deviceIds = new Set(instance.deviceIds)
  if (deviceIds.size > 0) {
    const removedXmlIds = new Set(
      doc.deviceMap.filter((d) => deviceIds.has(d.id)).map((d) => d.xml.id),
    )
    doc.deviceMap = doc.deviceMap.filter((d) => !deviceIds.has(d.id))
    doc.customSection.children = doc.customSection.children.filter((c) => !removedXmlIds.has(c.id))
  }
}
