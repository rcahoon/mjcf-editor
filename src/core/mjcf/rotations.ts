// Rotation math uses three.js's pure math classes (Quaternion/Euler/Vector3),
// not its rendering pipeline, so this stays usable from plain Vitest/Node.
import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { setAttr, formatFloats } from './attrUtils'
import type { XmlElementNode } from '../xml/xmlNode'
import type { Quat, RotationRepr, Vec3 } from './types'

export function mjQuatToThree([w, x, y, z]: Quat): Quaternion {
  return new Quaternion(x, y, z, w)
}

export function threeToMjQuat(q: Quaternion): Quat {
  return [q.w, q.x, q.y, q.z]
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

/**
 * Converts an MJCF orientation representation to a normalized MuJoCo-order
 * quaternion (w, x, y, z), given the document's compiler angle units and
 * euler sequence.
 *
 * Euler support: MuJoCo's `eulerseq` names an axis order of intrinsic
 * rotations (default 'xyz'); we map it onto three.js's Euler order strings,
 * which implement the same intrinsic-rotation convention for the common
 * non-repeating sequences (xyz, xzy, yxz, yzx, zxy, zyx). Repeated-axis
 * sequences (e.g. 'xyx') are not representable by three.js's Euler and fall
 * back to identity — a documented MVP limitation.
 */
export function orientationToQuat(
  repr: RotationRepr,
  angleUnits: 'degree' | 'radian',
  eulerseq: string,
): Quat {
  switch (repr.kind) {
    case 'quat': {
      const len = Math.hypot(...repr.quat)
      if (len === 0) return [1, 0, 0, 0]
      return repr.quat.map((v) => v / len) as Quat
    }
    case 'euler': {
      const [a, b, c] = repr.euler
      const rad: Vec3 =
        angleUnits === 'degree' ? [degToRad(a), degToRad(b), degToRad(c)] : [a, b, c]
      const order = eulerseq.toUpperCase()
      const validOrders = new Set(['XYZ', 'XZY', 'YXZ', 'YZX', 'ZXY', 'ZYX'])
      const euler = new Euler(rad[0], rad[1], rad[2], validOrders.has(order) ? (order as never) : 'XYZ')
      const q = new Quaternion().setFromEuler(euler)
      return threeToMjQuat(q)
    }
    case 'axisangle': {
      const [ax, ay, az] = repr.axis
      const axis = new Vector3(ax, ay, az)
      if (axis.lengthSq() === 0) return [1, 0, 0, 0]
      axis.normalize()
      const angle = angleUnits === 'degree' ? degToRad(repr.angle) : repr.angle
      const q = new Quaternion().setFromAxisAngle(axis, angle)
      return threeToMjQuat(q)
    }
    case 'xyaxes': {
      const x = new Vector3(...repr.xaxis).normalize()
      let y = new Vector3(...repr.yaxis)
      const z = new Vector3().crossVectors(x, y).normalize()
      y = new Vector3().crossVectors(z, x).normalize()
      const m = new Matrix4().makeBasis(x, y, z)
      const q = new Quaternion().setFromRotationMatrix(m)
      return threeToMjQuat(q)
    }
    case 'zaxis': {
      const z = new Vector3(...repr.zaxis)
      if (z.lengthSq() === 0) return [1, 0, 0, 0]
      z.normalize()
      const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), z)
      return threeToMjQuat(q)
    }
  }
}

/**
 * Converts a normalized MuJoCo quaternion back into the same representation
 * *kind* as `preferredRepr` (used so gizmo edits round-trip through the
 * original XML style rather than silently rewriting euler/axisangle nodes as
 * quat). Falls back to plain quat if the preferred kind can't cleanly recover
 * (xyaxes/zaxis, which are lossy/under-determined) — those are re-derived
 * from the quaternion's implied basis instead so they stay self-consistent.
 */
export function quatToOrientation(
  quat: Quat,
  angleUnits: 'degree' | 'radian',
  eulerseq: string,
  preferredKind: RotationRepr['kind'],
): RotationRepr {
  const q = mjQuatToThree(quat)
  switch (preferredKind) {
    case 'quat':
      return { kind: 'quat', quat }
    case 'euler': {
      const order = eulerseq.toUpperCase()
      const validOrders = new Set(['XYZ', 'XZY', 'YXZ', 'YZX', 'ZXY', 'ZYX'])
      const euler = new Euler().setFromQuaternion(q, validOrders.has(order) ? (order as never) : 'XYZ')
      const toUnit = (rad: number) => (angleUnits === 'degree' ? radToDeg(rad) : rad)
      return { kind: 'euler', euler: [toUnit(euler.x), toUnit(euler.y), toUnit(euler.z)] }
    }
    case 'axisangle': {
      const angleRad = 2 * Math.acos(Math.min(1, Math.max(-1, q.w)))
      const s = Math.sqrt(1 - q.w * q.w)
      const axis: Vec3 = s < 1e-6 ? [1, 0, 0] : [q.x / s, q.y / s, q.z / s]
      const angle = angleUnits === 'degree' ? radToDeg(angleRad) : angleRad
      return { kind: 'axisangle', axis, angle }
    }
    case 'xyaxes': {
      const x = new Vector3(1, 0, 0).applyQuaternion(q)
      const y = new Vector3(0, 1, 0).applyQuaternion(q)
      return { kind: 'xyaxes', xaxis: [x.x, x.y, x.z], yaxis: [y.x, y.y, y.z] }
    }
    case 'zaxis': {
      const z = new Vector3(0, 0, 1).applyQuaternion(q)
      return { kind: 'zaxis', zaxis: [z.x, z.y, z.z] }
    }
  }
}

/** Convenience: orientation repr -> three.js Quaternion, for scene-graph rendering. */
export function reprToThreeQuaternion(
  repr: RotationRepr,
  angleUnits: 'degree' | 'radian',
  eulerseq: string,
): Quaternion {
  return mjQuatToThree(orientationToQuat(repr, angleUnits, eulerseq))
}

const IDENTITY_QUAT: Quat = [1, 0, 0, 0]

/** Writes a RotationRepr onto an element's attributes, clearing whichever
 * orientation attribute kinds it doesn't use so switching kinds (e.g. via a
 * gizmo drag on a euler-authored node) doesn't leave stale attributes behind. */
export function writeRotationRepr(xml: XmlElementNode, repr: RotationRepr): void {
  setAttr(xml, 'quat', undefined)
  setAttr(xml, 'euler', undefined)
  setAttr(xml, 'axisangle', undefined)
  setAttr(xml, 'xyaxes', undefined)
  setAttr(xml, 'zaxis', undefined)
  switch (repr.kind) {
    case 'quat':
      if (repr.quat.some((v, i) => v !== IDENTITY_QUAT[i])) {
        setAttr(xml, 'quat', formatFloats(repr.quat))
      }
      break
    case 'euler':
      setAttr(xml, 'euler', formatFloats(repr.euler))
      break
    case 'axisangle':
      setAttr(xml, 'axisangle', formatFloats([...repr.axis, repr.angle]))
      break
    case 'xyaxes':
      setAttr(xml, 'xyaxes', formatFloats([...repr.xaxis, ...repr.yaxis]))
      break
    case 'zaxis':
      setAttr(xml, 'zaxis', formatFloats(repr.zaxis))
      break
  }
}
