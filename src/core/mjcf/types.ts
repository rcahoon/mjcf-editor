import type { NodeId } from '../xml/xmlNode'
import type { XmlElementNode } from '../xml/xmlNode'
import type { DeviceMapEntry } from '../deviceMap/types'

export type Vec3 = [number, number, number]
/** MuJoCo quaternion convention: (w, x, y, z). */
export type Quat = [number, number, number, number]
export type Vec4 = [number, number, number, number]

/**
 * MJCF supports several ways to specify orientation. We keep whichever
 * representation the source document used (or 'quat' for freshly-created
 * nodes) so export re-emits in the same style rather than always rewriting
 * everything as a quaternion.
 */
export type RotationRepr =
  | { kind: 'quat'; quat: Quat }
  | { kind: 'euler'; euler: Vec3 }
  | { kind: 'axisangle'; axis: Vec3; angle: number }
  | { kind: 'xyaxes'; xaxis: Vec3; yaxis: Vec3 }
  | { kind: 'zaxis'; zaxis: Vec3 }

export const IDENTITY_ROTATION: RotationRepr = { kind: 'quat', quat: [1, 0, 0, 0] }

export interface CompilerSettings {
  angle: 'degree' | 'radian'
  eulerseq: string
  xml: XmlElementNode
}

export interface OptionSettings {
  gravity?: Vec3
  timestep?: number
  xml: XmlElementNode
}

export interface DefaultClass {
  id: NodeId
  className?: string
  xml: XmlElementNode
  children: DefaultClass[]
}

export type AssetKind = 'mesh' | 'texture' | 'material' | 'other'

export interface AssetEntry {
  id: NodeId
  kind: AssetKind
  name: string
  file?: string
  scale?: Vec3
  /** For `kind: 'material'` assets. */
  rgba?: Vec4
  /** Populated at import time once mesh/texture bytes are resolved to a blob URL. */
  resolvedUrl?: string
  xml: XmlElementNode
}

export interface InertialNode {
  id: NodeId
  pos: Vec3
  mass: number
  diaginertia?: Vec3
  fullinertia?: [number, number, number, number, number, number]
  xml: XmlElementNode
}

export type GeomRole = 'visual' | 'collision' | 'both'
export type GeomType =
  | 'mesh'
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'capsule'
  | 'plane'
  | 'ellipsoid'

export interface GeomNode {
  id: NodeId
  name?: string
  type: GeomType
  meshRef?: string
  /** Raw MJCF `size` values; semantics depend on `type` (see geomSize.ts). */
  size: number[]
  pos: Vec3
  rotation: RotationRepr
  role: GeomRole
  materialRef?: string
  rgba?: Vec4
  xml: XmlElementNode
}

export interface SiteNode {
  id: NodeId
  name?: string
  pos: Vec3
  rotation: RotationRepr
  size: number[]
  xml: XmlElementNode
}

export type JointType = 'hinge' | 'slide' | 'ball' | 'free'

export interface JointNode {
  id: NodeId
  name?: string
  type: JointType
  pos: Vec3
  axis: Vec3
  range?: [number, number]
  damping?: number
  stiffness?: number
  xml: XmlElementNode
}

export interface BodyNode {
  id: NodeId
  name?: string
  pos: Vec3
  rotation: RotationRepr
  joints: JointNode[]
  geoms: GeomNode[]
  sites: SiteNode[]
  inertial?: InertialNode
  children: BodyNode[]
  xml: XmlElementNode
  /** Set on the root body of a mechanism instance's materialized subtree. */
  mechanismInstanceId?: string
}

export type ActuatorKind = 'motor' | 'position' | 'velocity' | 'general'
export type ActuatorTargetType = 'joint' | 'site'

export interface ActuatorEntry {
  id: NodeId
  kind: ActuatorKind
  name?: string
  target: { type: ActuatorTargetType; name: string }
  gear?: number
  ctrlrange?: [number, number]
  forcerange?: [number, number]
  kp?: number
  kv?: number
  xml: XmlElementNode
}

export type SensorKind =
  | 'jointpos'
  | 'jointvel'
  | 'jointactuatorfrc'
  | 'accelerometer'
  | 'gyro'
  | 'framepos'
  | 'framequat'
  | 'velocimeter'
  | 'force'
  | 'torque'
export type SensorTargetType = 'joint' | 'site'

export interface SensorEntry {
  id: NodeId
  kind: SensorKind
  name?: string
  target: { type: SensorTargetType; name: string }
  xml: XmlElementNode
}

export interface MjcfDocument {
  modelName: string
  compiler: CompilerSettings
  option: OptionSettings
  defaults: DefaultClass[]
  assets: AssetEntry[]
  worldbody: BodyNode
  actuators: ActuatorEntry[]
  sensors: SensorEntry[]
  /** The <custom> section element — source of truth for deviceMap plus any
   * non-device <text>/<numeric>/<tuple> children, which are left untouched. */
  customSection: XmlElementNode
  /** `dev.*`-prefixed <text> children of customSection, typed (see core/deviceMap). */
  deviceMap: DeviceMapEntry[]
  /** Sections we don't model in depth (tendon/equality/contact/keyframe/...): kept verbatim. */
  rawSections: XmlElementNode[]
  /** The <mujoco> root XmlNode — source of truth handed to serializeXmlDocument. */
  root: XmlElementNode
}
