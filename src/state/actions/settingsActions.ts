import { formatFloats, setAttr } from '../../core/mjcf/attrUtils'
import { collectAllBodies } from '../../core/mjcf/queries'
import { orientationToQuat } from '../../core/mjcf/rotations'
import { getOrCreateKeyframeSection } from '../../core/mjcf/keyframes'
import { elementNode, type NodeId } from '../../core/xml/xmlNode'
import type { MjcfDocument, Vec3 } from '../../core/mjcf/types'

export function setCompilerAngle(doc: MjcfDocument, angle: 'degree' | 'radian'): void {
  doc.compiler.angle = angle
  setAttr(doc.compiler.xml, 'angle', angle)
}

export function setCompilerEulerseq(doc: MjcfDocument, eulerseq: string): void {
  doc.compiler.eulerseq = eulerseq
  setAttr(doc.compiler.xml, 'eulerseq', eulerseq)
}

export function setGravity(doc: MjcfDocument, gravity: Vec3): void {
  doc.option.gravity = gravity
  setAttr(doc.option.xml, 'gravity', formatFloats(gravity))
}

export function setTimestep(doc: MjcfDocument, timestep: number): void {
  doc.option.timestep = timestep
  setAttr(doc.option.xml, 'timestep', formatFloats([timestep]))
}

/**
 * Builds a `<key qpos="...">` from the document's current pose-preview
 * state (spec §7.2: at least one keyframe must exist). qpos entries follow
 * MJCF's own ordering — depth-first body/joint declaration order — and
 * per-joint width: 1 for hinge/slide (the live preview value, default 0),
 * 4 for ball (identity quaternion — this editor's pose preview doesn't
 * support ball-joint rotation), 7 for free (the owning body's authored
 * pos+quat, since a free joint's qpos *is* its body's pose).
 */
export function addKeyframeFromCurrentPose(
  doc: MjcfDocument,
  jointPreview: Record<NodeId, number>,
  name: string,
): void {
  const values: number[] = []
  for (const body of collectAllBodies(doc.worldbody)) {
    for (const joint of body.joints) {
      if (joint.type === 'hinge' || joint.type === 'slide') {
        values.push(jointPreview[joint.id] ?? 0)
      } else if (joint.type === 'ball') {
        values.push(1, 0, 0, 0)
      } else if (joint.type === 'free') {
        values.push(...body.pos)
        values.push(...orientationToQuat(body.rotation, doc.compiler.angle, doc.compiler.eulerseq))
      }
    }
  }
  const section = getOrCreateKeyframeSection(doc)
  section.children.push(elementNode('key', { name, qpos: formatFloats(values) }))
}
