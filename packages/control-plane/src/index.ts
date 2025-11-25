import { createServer } from './server.js'

const start = async () => {
  const server = createServer()
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
