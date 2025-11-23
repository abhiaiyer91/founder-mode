import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createServer } from '../src/server.js'
import { seed } from '../prisma/seed.js'
import { prisma } from '../src/lib/prisma.js'

describe('control-plane routes', () => {
  const server = createServer()
  let consoleProjectId: string
  let productionDeploymentId: string

  beforeAll(async () => {
    await seed()
    await server.ready()
  })

  beforeEach(async () => {
    await seed()
    const consoleProject = await prisma.project.findFirst({ where: { name: 'HelixStack Console' } })
    consoleProjectId = consoleProject!.id
    const productionDeployment = await prisma.deployment.findFirst({
      where: { projectId: consoleProjectId, environment: 'production' },
      orderBy: { createdAt: 'desc' },
    })
    productionDeploymentId = productionDeployment!.id
  })

  afterAll(async () => {
    await server.close()
    await prisma.$disconnect()
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
      url: `/projects/${consoleProjectId}/deployments/${productionDeploymentId}/restart`,
      payload: { scope: 'global' },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.message).toContain('Restart scheduled')
    expect(body.deployment.status).toBeDefined()
  })
})
