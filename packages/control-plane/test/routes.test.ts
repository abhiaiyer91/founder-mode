import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from '../src/server.js'

describe('control-plane routes', () => {
  const server = createServer()

  beforeAll(async () => {
    await server.ready()
  })

  afterAll(async () => {
    await server.close()
  })

  it('returns projects', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/projects',
    })
    expect(response.statusCode).toBe(200)
    const projects = response.json()
    expect(Array.isArray(projects)).toBe(true)
    expect(projects[0]).toHaveProperty('name')
  })

  it('handles restart workflow', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/projects/proj_helix_console/deployments/deploy_main_001/restart',
      payload: { scope: 'global' },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.message).toContain('Restart scheduled')
    expect(body.deployment.status).toBeDefined()
  })
})
