import type { FastifyInstance } from 'fastify'

export const registerWebhookRoutes = async (app: FastifyInstance) => {
  app.post('/webhooks/github', async (request, reply) => {
    const event = request.headers['x-github-event']
    app.log.info({ event }, 'Received GitHub webhook')
    return { received: true }
  })
}
