import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { listProjects, recordRestart, recordRollback, appendDeployment } from '../src/data/store.js'
import { subscribeToDeploymentEvents } from '../src/events/bus.js'
import { prisma } from '../src/lib/prisma.js'
import { seed } from '../prisma/seed.js'

describe('control-plane data store', () => {
  let events: any[] = []
  let unsubscribe: () => void

  beforeAll(async () => {
    await seed()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await seed()
    events = []
    unsubscribe = subscribeToDeploymentEvents(event => events.push(event))
  })

  afterEach(() => {
    unsubscribe()
    vi.useRealTimers()
  })

  it('lists seeded projects', async () => {
    const projects = await listProjects()
    expect(projects.length).toBeGreaterThan(0)
    expect(projects[0]).toHaveProperty('repoUrl')
  })

  it('publishes events when recording a restart', async () => {
    const deploymentRecord = await prisma.deployment.findFirst({ where: { environment: 'production' } })
    expect(deploymentRecord).not.toBeNull()
    const deployment = await recordRestart(deploymentRecord!.id, 'global', { delayMs: 0 })
    expect(deployment?.status).toBe('building')
    expect(events.at(-1)).toMatchObject({
      type: 'restart',
      message: expect.stringContaining('Restart initiated'),
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    const refreshedDeployment = await prisma.deployment.findUnique({ where: { id: deploymentRecord!.id } })
    expect(refreshedDeployment?.status).toBe('ready')
  })

  it('publishes events on rollback', async () => {
    const deploymentRecord = await prisma.deployment.findFirst({ where: { environment: 'production' } })
    expect(deploymentRecord).not.toBeNull()
    const deployment = await recordRollback(deploymentRecord!.id, 'testing rollback')
    expect(deployment?.status).toBe('ready')
    expect(events.at(-1)).toMatchObject({
      type: 'rollback',
      message: expect.stringContaining('testing rollback'),
    })
  })

  it('publishes events on new deployment creation', async () => {
    const project = await prisma.project.findFirst({ where: { name: 'HelixStack Console' } })
    const build = await prisma.build.findFirst({ where: { projectId: project!.id } })
    const deployment = await appendDeployment({
      projectId: project!.id,
      buildId: build!.id,
      kind: 'production',
      status: 'ready',
      url: 'https://demo.helix.run',
      commitMessage: 'test deploy',
      author: 'test@helix.run',
      environment: 'production',
      regionRollout: [],
    })
    expect(deployment).toBeTruthy()
    expect(events.at(-1)).toMatchObject({
      type: 'deploy',
      deploymentId: deployment.id,
    })
  })
})
