import Fastify from 'fastify'
import cors from '@fastify/cors'
import { registerProjectRoutes } from './routes/projects.js'
import { registerWebhookRoutes } from './routes/webhooks.js'
import { registerEventRoutes } from './routes/events.js'
import { registerAuthRoutes } from './routes/auth.js'

export const createServer = () => {
  const server = Fastify({
    logger: {
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: { translateTime: 'SYS:standard', ignore: 'pid,hostname' },
            }
          : undefined,
    },
  })

  server.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
  })

  server.register(registerAuthRoutes)
  server.register(registerProjectRoutes)
  server.register(registerWebhookRoutes)
  server.register(registerEventRoutes)

  server.setErrorHandler((error, request, reply) => {
    request.log.error(error, 'Unhandled exception')
    reply.status(500).send({ message: 'Internal server error' })
  })

  return server
}
