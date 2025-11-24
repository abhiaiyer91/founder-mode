import type { Deployment as DeploymentDto, Project as ProjectDto } from '@helixstack/types'
import { publishDeploymentEvent } from '../events/bus.js'
import { prisma } from '../lib/prisma.js'

const mapProject = (project: { id: string } & Record<string, any>): ProjectDto => ({
  id: project.id,
  name: project.name,
  repoUrl: project.repoUrl,
  defaultBranch: project.defaultBranch,
  buildCommand: project.buildCommand,
  startCommand: project.startCommand,
  provider: project.provider,
  lastDeployAt: project.lastDeployAt.toISOString(),
  previewDomain: project.previewDomain,
  productionDomain: project.productionDomain,
  organizationId: project.organizationId ?? null,
  organizationName: project.organization?.name ?? null,
})

const mapDeployment = (deployment: { updatedAt: Date; createdAt: Date; regionRollout: unknown } & Record<string, any>): DeploymentDto => ({
  id: deployment.id,
  projectId: deployment.projectId,
  buildId: deployment.buildId,
  kind: deployment.kind as DeploymentDto['kind'],
  status: deployment.status as DeploymentDto['status'],
  url: deployment.url,
  createdAt: deployment.createdAt.toISOString(),
  updatedAt: deployment.updatedAt.toISOString(),
  commitMessage: deployment.commitMessage,
  author: deployment.author,
  environment: deployment.environment as DeploymentDto['environment'],
  regionRollout: (deployment.regionRollout as DeploymentDto['regionRollout']) ?? [],
})

export const listProjects = async (organizationId?: string): Promise<ProjectDto[]> => {
  const projects = await prisma.project.findMany({
    where: organizationId ? { organizationId } : undefined,
    include: { organization: true },
    orderBy: { name: 'asc' },
  })
  return projects.map(mapProject)
}

export const findProject = async (projectId: string): Promise<ProjectDto | null> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { organization: true },
  })
  return project ? mapProject(project) : null
}

export const listDeploymentsForProject = async (projectId: string): Promise<DeploymentDto[]> => {
  const deployments = await prisma.deployment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })
  return deployments.map(mapDeployment)
}

export const appendDeployment = async (deployment: Omit<DeploymentDto, 'id' | 'createdAt' | 'updatedAt'>) => {
  const record = await prisma.deployment.create({
    data: {
      projectId: deployment.projectId,
      buildId: deployment.buildId,
      kind: deployment.kind,
      status: deployment.status,
      url: deployment.url,
      commitMessage: deployment.commitMessage,
      author: deployment.author,
      environment: deployment.environment,
      regionRollout: deployment.regionRollout,
    },
  })
  const mapped = mapDeployment(record)
  publishDeploymentEvent({
    type: 'deploy',
    deploymentId: mapped.id,
    projectId: mapped.projectId,
    status: mapped.status,
    message: `Deployment recorded for ${mapped.environment}`,
    timestamp: mapped.updatedAt,
  })
  return mapped
}

export const findDeployment = async (projectId: string, deploymentId: string) => {
  const deployment = await prisma.deployment.findFirst({
    where: { id: deploymentId, projectId },
  })
  return deployment ? mapDeployment(deployment) : null
}

export const recordRollback = async (deploymentId: string, reason?: string) => {
  const deployment = await prisma.deployment.update({
    where: { id: deploymentId },
    data: { status: 'ready', updatedAt: new Date() },
  })
  const mapped = mapDeployment(deployment)
  publishDeploymentEvent({
    type: 'rollback',
    deploymentId,
    projectId: mapped.projectId,
    status: mapped.status,
    message: `Rollback completed${reason ? `: ${reason}` : ''}`,
    timestamp: mapped.updatedAt,
  })
  return mapped
}

interface RestartOptions {
  delayMs?: number
}

export const recordRestart = async (deploymentId: string, scope: string = 'global', options?: RestartOptions) => {
  const building = await prisma.deployment.update({
    where: { id: deploymentId },
    data: { status: 'building', updatedAt: new Date() },
  })
  const mapped = mapDeployment(building)
  publishDeploymentEvent({
    type: 'restart',
    deploymentId,
    projectId: mapped.projectId,
    status: mapped.status,
    message: `Restart initiated (${scope})`,
    timestamp: mapped.updatedAt,
  })

  const delay = options?.delayMs ?? 2000
  setTimeout(async () => {
    const ready = await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: 'ready', updatedAt: new Date() },
    })
    const mappedReady = mapDeployment(ready)
    publishDeploymentEvent({
      type: 'restart',
      deploymentId,
      projectId: mappedReady.projectId,
      status: mappedReady.status,
      message: 'Restart completed',
      timestamp: mappedReady.updatedAt,
    })
  }, delay)

  return mapped
}
