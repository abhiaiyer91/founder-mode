import Fastify from 'fastify'
import cors from '@fastify/cors'
import { registerProjectRoutes } from './routes/projects.js'
import { registerWebhookRoutes } from './routes/webhooks.js'
import { registerEventRoutes } from './routes/events.js'

const buildServer = () => {
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

  server.register(registerProjectRoutes)
  server.register(registerWebhookRoutes)
  server.register(registerEventRoutes)

  server.setErrorHandler((error, request, reply) => {
    request.log.error(error, 'Unhandled exception')
    reply.status(500).send({ message: 'Internal server error' })
  })

  return server
}

const start = async () => {
  const server = buildServer()
  const port = Number(process.env.PORT ?? 4000)
  const host = process.env.HOST ?? '0.0.0.0'
  try {
    await server.listen({ port, host })
    server.log.info(`Control plane ready on http://${host}:${port}`)
  } catch (error) {
    server.log.error(error)
    process.exit(1)
  }
}

start()
