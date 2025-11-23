import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { listProjects, recordRestart, recordRollback, appendDeployment } from '../src/data/store.js'
import { subscribeToDeploymentEvents } from '../src/events/bus.js'

describe('control-plane data store', () => {
  let events: any[] = []
  let unsubscribe: () => void

  beforeEach(() => {
    events = []
    unsubscribe = subscribeToDeploymentEvents(event => events.push(event))
  })

  afterEach(() => {
    unsubscribe()
    vi.useRealTimers()
  })

  it('lists seeded projects', () => {
    const projects = listProjects()
    expect(projects.length).toBeGreaterThan(0)
    expect(projects[0]).toHaveProperty('repoUrl')
  })

  it('publishes events when recording a restart', () => {
    vi.useFakeTimers()
    const deployment = recordRestart('deploy_main_001', 'global')
    expect(deployment?.status).toBe('building')
    expect(events.at(-1)).toMatchObject({
      type: 'restart',
      message: expect.stringContaining('Restart initiated'),
    })
    vi.runAllTimers()
    expect(events.some(event => event.message === 'Restart completed')).toBe(true)
  })

  it('publishes events on rollback', () => {
    const deployment = recordRollback('deploy_main_001', 'testing rollback')
    expect(deployment?.status).toBe('ready')
    expect(events.at(-1)).toMatchObject({
      type: 'rollback',
      message: expect.stringContaining('testing rollback'),
    })
  })

  it('publishes events on new deployment creation', () => {
    const deployment = appendDeployment({
      projectId: 'proj_helix_console',
      buildId: 'build_001',
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
