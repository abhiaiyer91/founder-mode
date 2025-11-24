import type { FastifyInstance } from 'fastify'
import { toNodeHandler } from 'better-auth/node'
import { auth } from '../auth/betterAuth.js'

export const registerAuthRoutes = async (app: FastifyInstance) => {
  const handler = toNodeHandler(auth)

  app.all('/auth/*', async (request, reply) => {
    reply.hijack()
    await handler(request.raw, reply.raw)
  })
}
