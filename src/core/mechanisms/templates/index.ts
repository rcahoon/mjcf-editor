import { registerMechanism } from '../registry'
import { armTemplate } from './arm'
import { elevatorTemplate } from './elevator'

let registered = false

/** Idempotent — safe to call from module init or app startup more than once. */
export function registerBuiltinMechanisms(): void {
  if (registered) return
  registered = true
  registerMechanism(armTemplate)
  registerMechanism(elevatorTemplate)
}
