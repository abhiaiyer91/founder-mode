import type { FastifyInstance } from 'fastify'
import {
  findDeployment,
  findProject,
  listDeploymentsForProject,
  listProjects,
  recordRestart,
  recordRollback,
} from '../data/store.js'
import type { RestartPayload, RollbackPayload } from '@helixstack/types'

export const registerProjectRoutes = async (app: FastifyInstance) => {
  app.get('/healthz', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  app.get('/projects', async (request) => {
    const { organizationId } = (request.query ?? {}) as { organizationId?: string }
    return listProjects(organizationId)
  })

  app.get('/projects/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string }
    const project = await findProject(projectId)
    if (!project) {
      reply.code(404)
      return { message: `Project ${projectId} not found` }
    }
    return project
  })

  app.get('/projects/:projectId/deployments', async (request, reply) => {
    const { projectId } = request.params as { projectId: string }
    const project = await findProject(projectId)
    if (!project) {
      reply.code(404)
      return { message: `Project ${projectId} not found` }
    }
    return listDeploymentsForProject(projectId)
  })

  app.post('/projects/:projectId/deployments/:deploymentId/rollback', async (request, reply) => {
    const { projectId, deploymentId } = request.params as { projectId: string; deploymentId: string }
    const deployment = await findDeployment(projectId, deploymentId)
    if (!deployment) {
      reply.code(404)
      return { message: 'Deployment not found' }
    }

    const body = (request.body || {}) as RollbackPayload
    const updated = await recordRollback(deploymentId, body.reason)
    return {
      deployment: updated,
      message: `Rollback triggered${body.reason ? `: ${body.reason}` : ''}`,
    }
  })

  app.post('/projects/:projectId/deployments/:deploymentId/restart', async (request, reply) => {
    const { projectId, deploymentId } = request.params as { projectId: string; deploymentId: string }
    const deployment = await findDeployment(projectId, deploymentId)
    if (!deployment) {
      reply.code(404)
      return { message: 'Deployment not found' }
    }

    const body = (request.body || {}) as RestartPayload
    const updated = await recordRestart(deploymentId, body.scope)
    return {
      deployment: updated,
      message: `Restart scheduled (${body.scope ?? 'global'})`,
    }
  })
}
