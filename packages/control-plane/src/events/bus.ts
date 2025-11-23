import { EventEmitter } from 'node:events'
import type { DeploymentEvent } from '@helixstack/types'

const emitter = new EventEmitter()

export const publishDeploymentEvent = (event: DeploymentEvent) => {
  emitter.emit('deployment', event)
}

export const subscribeToDeploymentEvents = (handler: (event: DeploymentEvent) => void) => {
  emitter.on('deployment', handler)
  return () => emitter.off('deployment', handler)
}
