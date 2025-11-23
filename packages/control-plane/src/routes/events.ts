import type { FastifyInstance } from 'fastify'
import { publishDeploymentEvent, subscribeToDeploymentEvents } from '../events/bus.js'

export const registerEventRoutes = async (app: FastifyInstance) => {
  app.get('/events/deployments', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    const sendEvent = (event: unknown) => {
      reply.raw.write(`event: deployment\n`)
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`)
    }

    const unsubscribe = subscribeToDeploymentEvents(sendEvent)

    request.socket.on('close', () => {
      unsubscribe()
    })

    // emit heartbeat comment
    const heartbeat = setInterval(() => {
      reply.raw.write(':heartbeat\n\n')
    }, 15000)

    request.socket.on('close', () => {
      clearInterval(heartbeat)
    })
  })

  // emit a dummy deploy event every minute to prove the wire-up (optional)
  if (process.env.NODE_ENV !== 'production') {
    setInterval(() => {
      publishDeploymentEvent({
        type: 'deploy',
        deploymentId: 'demo',
        projectId: 'demo',
        status: 'ready',
        message: 'SSE heartbeat deploy',
        timestamp: new Date().toISOString(),
      })
    }, 60000)
  }
}
