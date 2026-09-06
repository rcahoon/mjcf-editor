import type { MechanismTemplate } from './types'

const registry = new Map<string, MechanismTemplate>()

export function registerMechanism(template: MechanismTemplate): void {
  registry.set(template.id, template)
}

export function getMechanismTemplate(id: string): MechanismTemplate | undefined {
  return registry.get(id)
}

export function listMechanismTemplates(): MechanismTemplate[] {
  return Array.from(registry.values())
}
