import type { XmlElementNode } from '../xml/xmlNode'
import type { ActuatorEntry, AssetEntry, BodyNode, SensorEntry } from '../mjcf/types'
import type { DeviceMapEntry } from '../deviceMap/types'

export type MechanismParamType = 'number' | 'vec3' | 'range' | 'enum' | 'boolean'

export interface MechanismParamSchema {
  key: string
  label: string
  type: MechanismParamType
  default: unknown
  min?: number
  max?: number
  step?: number
  options?: string[]
}

/** What a template's `build()` produces: plain XmlElementNode trees authored
 * with local (un-namespaced) names. expandInstance() renames these and
 * parses them into the typed model, reusing the ordinary MJCF parse
 * functions rather than duplicating typed-construction logic. */
export interface RawMechanismFragment {
  bodies: XmlElementNode[]
  actuators: XmlElementNode[]
  sensors: XmlElementNode[]
  assets: XmlElementNode[]
  /** `<text name="dev...">` device map entries (see core/deviceMap). */
  devices: XmlElementNode[]
}

export interface MechanismTemplate {
  id: string
  name: string
  category: string
  description: string
  params: MechanismParamSchema[]
  build: (params: Record<string, unknown>) => RawMechanismFragment
}

/** The result of expandInstance(): a namespaced fragment already parsed into
 * the typed model, ready to splice into a BodyNode's children / the
 * document's actuator/sensor/asset lists. */
export interface ExpandedMechanismFragment {
  bodies: BodyNode[]
  actuators: ActuatorEntry[]
  sensors: SensorEntry[]
  assets: AssetEntry[]
  devices: DeviceMapEntry[]
}

export interface MechanismInstance {
  id: string
  templateId: string
  instanceName: string
  paramOverrides: Record<string, unknown>
  attachPointBodyId: string
  /** Root body id(s) of this instance's materialized subtree, for lookup/replacement. */
  rootBodyIds: string[]
  /** Device map entry ids this instance created — tracked explicitly (unlike
   * actuators/sensors, which are found by namespace-prefixed name) because a
   * device's own `dev.<idSpace>.<id>` identity is deliberately not
   * namespace-prefixed (see core/mechanisms/namespace.ts). */
  deviceIds: string[]
  linked: boolean
}
