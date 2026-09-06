import {
  findChild,
  findChildren,
  getOrCreateChild,
  makeNodeId,
  parseXmlDocument,
  type XmlElementNode,
  type XmlNode,
} from '../xml/xmlNode'
import { getAttr, parseFloatsAttr, parseVec3Attr } from './attrUtils'
import { MJCF_DEFAULTS } from './defaults'
import { IDENTITY_ROTATION } from './types'
import type {
  ActuatorEntry,
  ActuatorKind,
  AssetEntry,
  AssetKind,
  BodyNode,
  CompilerSettings,
  DefaultClass,
  GeomNode,
  GeomType,
  InertialNode,
  JointNode,
  JointType,
  MjcfDocument,
  OptionSettings,
  RotationRepr,
  SensorEntry,
  SensorKind,
  SiteNode,
} from './types'

function isElement(node: XmlNode): node is XmlElementNode {
  return node.kind === 'element'
}

export function parseRotationRepr(xml: XmlElementNode): RotationRepr {
  const quat = parseFloatsAttr(xml, 'quat')
  if (quat) return { kind: 'quat', quat: [quat[0] ?? 1, quat[1] ?? 0, quat[2] ?? 0, quat[3] ?? 0] }
  const euler = parseFloatsAttr(xml, 'euler')
  if (euler) return { kind: 'euler', euler: [euler[0] ?? 0, euler[1] ?? 0, euler[2] ?? 0] }
  const axisangle = parseFloatsAttr(xml, 'axisangle')
  if (axisangle) {
    return {
      kind: 'axisangle',
      axis: [axisangle[0] ?? 0, axisangle[1] ?? 0, axisangle[2] ?? 1],
      angle: axisangle[3] ?? 0,
    }
  }
  const xyaxes = parseFloatsAttr(xml, 'xyaxes')
  if (xyaxes) {
    return {
      kind: 'xyaxes',
      xaxis: [xyaxes[0] ?? 1, xyaxes[1] ?? 0, xyaxes[2] ?? 0],
      yaxis: [xyaxes[3] ?? 0, xyaxes[4] ?? 1, xyaxes[5] ?? 0],
    }
  }
  const zaxis = parseFloatsAttr(xml, 'zaxis')
  if (zaxis) return { kind: 'zaxis', zaxis: [zaxis[0] ?? 0, zaxis[1] ?? 0, zaxis[2] ?? 1] }
  return IDENTITY_ROTATION
}

const GEOM_TYPES: GeomType[] = ['mesh', 'box', 'sphere', 'cylinder', 'capsule', 'plane', 'ellipsoid']
const JOINT_TYPES: JointType[] = ['hinge', 'slide', 'ball', 'free']
const SENSOR_KINDS: SensorKind[] = [
  'jointpos',
  'jointvel',
  'jointactuatorfrc',
  'accelerometer',
  'gyro',
  'framepos',
  'framequat',
  'velocimeter',
  'force',
  'torque',
]

/**
 * Heuristic visual/collision classification: MJCF has no single authoritative
 * flag for this. The common convention (used by MuJoCo's own example models)
 * is contype=conaffinity=0 for purely-decorative geoms; everything else is
 * treated as participating in collision (and is still rendered, since most
 * real models only author one geom per body serving both purposes).
 */
function classifyGeomRole(xml: XmlElementNode): GeomNode['role'] {
  const contype = parseFloatsAttr(xml, 'contype')?.[0]
  const conaffinity = parseFloatsAttr(xml, 'conaffinity')?.[0]
  if (contype === 0 && conaffinity === 0) return 'visual'
  return 'both'
}

export function parseJoint(xml: XmlElementNode): JointNode {
  const typeAttr = getAttr(xml, 'type')
  const type = (JOINT_TYPES.includes(typeAttr as JointType) ? typeAttr : MJCF_DEFAULTS.joint.type) as JointType
  const range = parseFloatsAttr(xml, 'range')
  return {
    id: makeNodeId(),
    name: getAttr(xml, 'name'),
    type,
    pos: parseVec3Attr(xml, 'pos') ?? MJCF_DEFAULTS.joint.pos,
    axis: parseVec3Attr(xml, 'axis') ?? MJCF_DEFAULTS.joint.axis,
    range: range ? [range[0] ?? 0, range[1] ?? 0] : undefined,
    damping: parseFloatsAttr(xml, 'damping')?.[0],
    stiffness: parseFloatsAttr(xml, 'stiffness')?.[0],
    xml,
  }
}

function parseFreejoint(xml: XmlElementNode): JointNode {
  return {
    id: makeNodeId(),
    name: getAttr(xml, 'name'),
    type: 'free',
    pos: [0, 0, 0],
    axis: [0, 0, 1],
    xml,
  }
}

export function parseGeom(xml: XmlElementNode): GeomNode {
  const typeAttr = getAttr(xml, 'type')
  const type = (GEOM_TYPES.includes(typeAttr as GeomType) ? typeAttr : MJCF_DEFAULTS.geom.type) as GeomType
  const rgba = parseFloatsAttr(xml, 'rgba')
  return {
    id: makeNodeId(),
    name: getAttr(xml, 'name'),
    type,
    meshRef: getAttr(xml, 'mesh'),
    size: parseFloatsAttr(xml, 'size') ?? MJCF_DEFAULTS.geom.size,
    pos: parseVec3Attr(xml, 'pos') ?? MJCF_DEFAULTS.geom.pos,
    rotation: parseRotationRepr(xml),
    role: classifyGeomRole(xml),
    materialRef: getAttr(xml, 'material'),
    rgba: rgba ? [rgba[0] ?? 1, rgba[1] ?? 1, rgba[2] ?? 1, rgba[3] ?? 1] : undefined,
    xml,
  }
}

export function parseSite(xml: XmlElementNode): SiteNode {
  return {
    id: makeNodeId(),
    name: getAttr(xml, 'name'),
    pos: parseVec3Attr(xml, 'pos') ?? MJCF_DEFAULTS.site.pos,
    rotation: parseRotationRepr(xml),
    size: parseFloatsAttr(xml, 'size') ?? MJCF_DEFAULTS.site.size,
    xml,
  }
}

export function parseInertial(xml: XmlElementNode): InertialNode {
  const full = parseFloatsAttr(xml, 'fullinertia')
  return {
    id: makeNodeId(),
    pos: parseVec3Attr(xml, 'pos') ?? [0, 0, 0],
    mass: parseFloatsAttr(xml, 'mass')?.[0] ?? 0,
    diaginertia: parseVec3Attr(xml, 'diaginertia'),
    fullinertia: full
      ? ([full[0], full[1], full[2], full[3], full[4], full[5]] as InertialNode['fullinertia'])
      : undefined,
    xml,
  }
}

export function parseBody(xml: XmlElementNode): BodyNode {
  const joints = findChildren(xml, 'joint').map(parseJoint)
  const freejoint = findChild(xml, 'freejoint')
  if (freejoint) joints.unshift(parseFreejoint(freejoint))
  const inertialXml = findChild(xml, 'inertial')
  return {
    id: makeNodeId(),
    name: getAttr(xml, 'name'),
    pos: parseVec3Attr(xml, 'pos') ?? MJCF_DEFAULTS.body.pos,
    rotation: parseRotationRepr(xml),
    joints,
    geoms: findChildren(xml, 'geom').map(parseGeom),
    sites: findChildren(xml, 'site').map(parseSite),
    inertial: inertialXml ? parseInertial(inertialXml) : undefined,
    children: findChildren(xml, 'body').map(parseBody),
    xml,
  }
}

export function parseAsset(xml: XmlElementNode): AssetEntry {
  const kindMap: Record<string, AssetKind> = { mesh: 'mesh', texture: 'texture', material: 'material' }
  const kind = kindMap[xml.tag] ?? 'other'
  return {
    id: makeNodeId(),
    kind,
    name: getAttr(xml, 'name') ?? getAttr(xml, 'file') ?? xml.tag,
    file: getAttr(xml, 'file'),
    scale: parseVec3Attr(xml, 'scale'),
    rgba: (() => {
      const rgba = parseFloatsAttr(xml, 'rgba')
      return rgba ? [rgba[0] ?? 1, rgba[1] ?? 1, rgba[2] ?? 1, rgba[3] ?? 1] : undefined
    })(),
    xml,
  }
}

const ACTUATOR_KINDS: ActuatorKind[] = ['motor', 'position', 'velocity', 'general']

export function parseActuator(xml: XmlElementNode): ActuatorEntry {
  const kind = (ACTUATOR_KINDS.includes(xml.tag as ActuatorKind) ? xml.tag : 'general') as ActuatorKind
  const jointRef = getAttr(xml, 'joint')
  const siteRef = getAttr(xml, 'site')
  const target: ActuatorEntry['target'] = jointRef
    ? { type: 'joint', name: jointRef }
    : { type: 'site', name: siteRef ?? '' }
  const ctrlrange = parseFloatsAttr(xml, 'ctrlrange')
  const forcerange = parseFloatsAttr(xml, 'forcerange')
  return {
    id: makeNodeId(),
    kind,
    name: getAttr(xml, 'name'),
    target,
    gear: parseFloatsAttr(xml, 'gear')?.[0],
    ctrlrange: ctrlrange ? [ctrlrange[0] ?? 0, ctrlrange[1] ?? 0] : undefined,
    forcerange: forcerange ? [forcerange[0] ?? 0, forcerange[1] ?? 0] : undefined,
    kp: parseFloatsAttr(xml, 'kp')?.[0],
    kv: parseFloatsAttr(xml, 'kv')?.[0],
    xml,
  }
}

export function parseSensor(xml: XmlElementNode): SensorEntry {
  const kind = (SENSOR_KINDS.includes(xml.tag as SensorKind) ? xml.tag : 'jointpos') as SensorKind
  let target: SensorEntry['target']
  if (kind === 'jointpos' || kind === 'jointvel' || kind === 'jointactuatorfrc') {
    target = { type: 'joint', name: getAttr(xml, 'joint') ?? '' }
  } else if (kind === 'framepos' || kind === 'framequat') {
    target = { type: 'site', name: getAttr(xml, 'objname') ?? '' }
  } else {
    target = { type: 'site', name: getAttr(xml, 'site') ?? '' }
  }
  return { id: makeNodeId(), kind, name: getAttr(xml, 'name'), target, xml }
}

function parseDefaultClass(xml: XmlElementNode): DefaultClass {
  return {
    id: makeNodeId(),
    className: getAttr(xml, 'class'),
    xml,
    children: findChildren(xml, 'default').map(parseDefaultClass),
  }
}

/** Parses a Layer-0 `<mujoco>` XmlElementNode into the typed MjcfDocument (Layer 1). */
export function parseMjcfDocument(root: XmlElementNode): MjcfDocument {
  if (root.tag !== 'mujoco') {
    throw new Error(`Expected root <mujoco> element, got <${root.tag}>`)
  }
  const compilerXml = getOrCreateChild(root, 'compiler')
  const optionXml = getOrCreateChild(root, 'option')
  const compiler: CompilerSettings = {
    angle: (getAttr(compilerXml, 'angle') as 'degree' | 'radian') ?? MJCF_DEFAULTS.compiler.angle,
    eulerseq: getAttr(compilerXml, 'eulerseq') ?? MJCF_DEFAULTS.compiler.eulerseq,
    xml: compilerXml,
  }
  const option: OptionSettings = {
    gravity: parseVec3Attr(optionXml, 'gravity'),
    timestep: parseFloatsAttr(optionXml, 'timestep')?.[0],
    xml: optionXml,
  }
  const defaults = findChildren(root, 'default').map(parseDefaultClass)
  const assetXml = findChild(root, 'asset')
  const assets = assetXml ? findChildrenElements(assetXml).map(parseAsset) : []
  const worldbodyXml = getOrCreateChild(root, 'worldbody')
  const worldbody = parseBody(worldbodyXml)
  const actuatorXml = findChild(root, 'actuator')
  const actuators = actuatorXml ? findChildrenElements(actuatorXml).map(parseActuator) : []
  const sensorXml = findChild(root, 'sensor')
  const sensors = sensorXml ? findChildrenElements(sensorXml).map(parseSensor) : []

  const consumedTags = new Set(['compiler', 'option', 'default', 'asset', 'worldbody', 'actuator', 'sensor'])
  const rawSections = root.children.filter(
    (c): c is XmlElementNode => isElement(c) && !consumedTags.has(c.tag),
  )

  return {
    modelName: getAttr(root, 'model') ?? 'model',
    compiler,
    option,
    defaults,
    assets,
    worldbody,
    actuators,
    sensors,
    rawSections,
    root,
  }
}

function findChildrenElements(xml: XmlElementNode): XmlElementNode[] {
  return xml.children.filter(isElement)
}

export function parseMjcfString(text: string): MjcfDocument {
  const root = parseXmlDocument(text)
  return parseMjcfDocument(root)
}
