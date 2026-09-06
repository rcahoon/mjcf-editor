import type { MjcfDocument, BodyNode } from '../../core/mjcf/types'
import type { Selection } from '../../state/store'

export interface TreeItem {
  id: string
  label: string
  selection?: Selection
  children?: TreeItem[]
}

function bodyToItem(body: BodyNode, isRoot: boolean): TreeItem {
  const children: TreeItem[] = []
  for (const j of body.joints) {
    children.push({
      id: `joint:${j.id}`,
      label: `⚙ ${j.name ?? '(joint)'} [${j.type}]`,
      selection: { kind: 'joint', id: j.id },
    })
  }
  for (const g of body.geoms) {
    children.push({
      id: `geom:${g.id}`,
      label: `◆ ${g.name ?? '(geom)'} [${g.type}]`,
      selection: { kind: 'geom', id: g.id },
    })
  }
  for (const s of body.sites) {
    children.push({
      id: `site:${s.id}`,
      label: `● ${s.name ?? '(site)'}`,
      selection: { kind: 'site', id: s.id },
    })
  }
  for (const c of body.children) children.push(bodyToItem(c, false))

  return {
    id: `body:${body.id}`,
    label: isRoot ? 'worldbody' : (body.name ?? '(unnamed body)'),
    selection: isRoot ? undefined : { kind: 'body', id: body.id },
    children,
  }
}

export function buildTreeData(doc: MjcfDocument): TreeItem[] {
  const worldItem = bodyToItem(doc.worldbody, true)
  const actuatorsItem: TreeItem = {
    id: 'section:actuators',
    label: `Actuators (${doc.actuators.length})`,
    children: doc.actuators.map((a) => ({
      id: `actuator:${a.id}`,
      label: `${a.name ?? '(actuator)'} [${a.kind}]`,
      selection: { kind: 'actuator', id: a.id },
    })),
  }
  const sensorsItem: TreeItem = {
    id: 'section:sensors',
    label: `Sensors (${doc.sensors.length})`,
    children: doc.sensors.map((s) => ({
      id: `sensor:${s.id}`,
      label: `${s.name ?? '(sensor)'} [${s.kind}]`,
      selection: { kind: 'sensor', id: s.id },
    })),
  }
  return [worldItem, actuatorsItem, sensorsItem]
}
