import type { XmlElementNode, XmlNode } from '../xml/xmlNode'
import { parseActuator, parseAsset, parseBody, parseSensor } from '../mjcf/parseMjcf'
import type { ExpandedMechanismFragment, MechanismTemplate, RawMechanismFragment } from './types'

const REFERENCE_ATTRS = ['joint', 'site', 'mesh', 'material', 'objname'] as const

function isElement(node: XmlNode): node is XmlElementNode {
  return node.kind === 'element'
}

function collectLocalNames(fragment: RawMechanismFragment): Set<string> {
  const names = new Set<string>()
  function walk(xml: XmlElementNode): void {
    if (xml.attrs.name) names.add(xml.attrs.name)
    for (const child of xml.children) if (isElement(child)) walk(child)
  }
  fragment.bodies.forEach(walk)
  fragment.assets.forEach(walk)
  fragment.actuators.forEach(walk)
  fragment.sensors.forEach(walk)
  return names
}

function renameInPlace(xml: XmlElementNode, renameMap: Map<string, string>): void {
  const currentName = xml.attrs.name
  if (currentName && renameMap.has(currentName)) {
    xml.attrs.name = renameMap.get(currentName)!
  }
  for (const refAttr of REFERENCE_ATTRS) {
    const ref = xml.attrs[refAttr]
    if (ref && renameMap.has(ref)) {
      xml.attrs[refAttr] = renameMap.get(ref)!
    }
  }
  for (const child of xml.children) if (isElement(child)) renameInPlace(child, renameMap)
}

/**
 * Instantiates a mechanism template: builds its fragment (authored with
 * local names like "shoulder_joint"), then namespaces every declared name
 * and every internal joint/site/mesh/material reference by prefixing with
 * `${namespace}_`, so two instances of the same template (e.g. "left"/"right"
 * swerve modules) never collide — MJCF names are flat per-type namespaces,
 * not scoped to a body. References to names *outside* the fragment are left
 * untouched since they can't appear in a template built from scratch.
 *
 * Namespaced XML is then run through the ordinary MJCF parse functions, so
 * the same parsing logic produces the typed model here as for imported files.
 */
export function expandInstance(
  template: MechanismTemplate,
  params: Record<string, unknown>,
  namespace: string,
): ExpandedMechanismFragment {
  const fragment = template.build(params)
  const localNames = collectLocalNames(fragment)
  const renameMap = new Map<string, string>()
  for (const name of localNames) renameMap.set(name, `${namespace}_${name}`)

  for (const b of fragment.bodies) renameInPlace(b, renameMap)
  for (const a of fragment.assets) renameInPlace(a, renameMap)
  for (const a of fragment.actuators) renameInPlace(a, renameMap)
  for (const s of fragment.sensors) renameInPlace(s, renameMap)

  return {
    bodies: fragment.bodies.map(parseBody),
    actuators: fragment.actuators.map(parseActuator),
    sensors: fragment.sensors.map(parseSensor),
    assets: fragment.assets.map(parseAsset),
  }
}
