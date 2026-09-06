import { describe, expect, it } from 'vitest'
import { SIMPLE_ARM_MJCF } from '../../../src/core/mjcf/sampleFixtures'
import { parseMjcfString } from '../../../src/core/mjcf/parseMjcf'
import { serializeMjcfDocument } from '../../../src/core/mjcf/serializeMjcf'

function collectJointNames(doc: ReturnType<typeof parseMjcfString>): string[] {
  const names: string[] = []
  function walk(body: (typeof doc.worldbody)): void {
    for (const j of body.joints) if (j.name) names.push(j.name)
    for (const c of body.children) walk(c)
  }
  walk(doc.worldbody)
  return names
}

describe('MJCF parse/serialize round-trip', () => {
  it('parses the simple-arm fixture with expected structure', () => {
    const doc = parseMjcfString(SIMPLE_ARM_MJCF)
    expect(doc.modelName).toBe('simple_arm')
    expect(collectJointNames(doc)).toEqual(['shoulder_joint', 'elbow_joint'])
    expect(doc.actuators).toHaveLength(2)
    expect(doc.sensors).toHaveLength(2)
    expect(doc.worldbody.children[0].name).toBe('base')
  })

  it('round-trips parse -> serialize -> parse with identical structure', () => {
    const doc1 = parseMjcfString(SIMPLE_ARM_MJCF)
    const xml2 = serializeMjcfDocument(doc1)
    const doc2 = parseMjcfString(xml2)

    expect(doc2.modelName).toBe(doc1.modelName)
    expect(collectJointNames(doc2)).toEqual(collectJointNames(doc1))
    expect(doc2.actuators.map((a) => a.name)).toEqual(doc1.actuators.map((a) => a.name))
    expect(doc2.sensors.map((s) => s.name)).toEqual(doc1.sensors.map((s) => s.name))
    expect(doc2.assets.map((a) => a.name)).toEqual(doc1.assets.map((a) => a.name))
  })

  it('preserves unrecognized attributes and elements through edit + serialize', () => {
    const doc = parseMjcfString(SIMPLE_ARM_MJCF)
    // Simulate an attribute/element this editor doesn't model.
    doc.worldbody.children[0].xml.attrs['data-custom-flag'] = 'yes'
    doc.root.children.push({
      kind: 'element',
      id: 'extra-1',
      tag: 'custom-note',
      attrs: { text: 'do-not-drop-me' },
      children: [],
    })

    // Simulate an ordinary typed edit elsewhere in the doc.
    doc.worldbody.children[0].children[0].joints[0].xml.attrs.damping = '0.5'

    const xml = serializeMjcfDocument(doc)
    expect(xml).toContain('data-custom-flag="yes"')
    expect(xml).toContain('do-not-drop-me')
    expect(xml).toContain('damping="0.5"')
  })
})
