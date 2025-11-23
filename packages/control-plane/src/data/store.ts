import { nanoid } from 'nanoid'
import type { Build, Deployment, Project } from '@helixstack/types'
import { publishDeploymentEvent } from '../events/bus.js'

const projects: Project[] = [
  {
    id: 'proj_helix_console',
    name: 'HelixStack Console',
    repoUrl: 'https://github.com/helixstack/console',
    defaultBranch: 'main',
    buildCommand: 'pnpm build',
    startCommand: 'pnpm dev',
    provider: 'fly-io',
    lastDeployAt: new Date().toISOString(),
    previewDomain: 'preview.console.helix.run',
    productionDomain: 'console.helix.run',
  },
  {
    id: 'proj_ai_docs',
    name: 'AI Docs Service',
    repoUrl: 'https://github.com/acme/ai-docs',
    defaultBranch: 'main',
    buildCommand: 'npm run build',
    startCommand: 'npm start',
    provider: 'aws-lambda',
    lastDeployAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    previewDomain: 'preview.ai-docs.helix.run',
    productionDomain: 'ai-docs.example.com',
  },
]

const builds: Build[] = [
  {
    id: 'build_001',
    projectId: 'proj_helix_console',
    commitSha: '9d12f89',
    branch: 'main',
    command: 'pnpm build',
    startedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    status: 'succeeded',
    artifactUrl: 'oci://registry.helix.run/helix-console/main:9d12f89',
  },
  {
    id: 'build_002',
    projectId: 'proj_helix_console',
    commitSha: 'f7abcee',
    branch: 'feature/runtime-api',
    command: 'pnpm build',
    startedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    status: 'succeeded',
    artifactUrl: 'oci://registry.helix.run/helix-console/preview/pr-42:f7abcee',
  },
  {
    id: 'build_003',
    projectId: 'proj_ai_docs',
    commitSha: 'b671221',
    branch: 'main',
    command: 'npm run build',
    startedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    status: 'succeeded',
    artifactUrl: 'oci://registry.helix.run/ai-docs/main:b671221',
  },
]

const deployments: Deployment[] = [
  {
    id: 'deploy_main_001',
    projectId: 'proj_helix_console',
    buildId: 'build_001',
    kind: 'production',
    status: 'ready',
    url: 'https://console.helix.run',
    createdAt: builds[0].completedAt,
    updatedAt: builds[0].completedAt,
    commitMessage: 'feat: add deployment flow UI',
    author: 'abi@helix.run',
    environment: 'production',
    regionRollout: [
      { region: 'iad', status: 'ready' },
      { region: 'cdg', status: 'ready' },
      { region: 'bom', status: 'ready' },
    ],
  },
  {
    id: 'deploy_pr42',
    projectId: 'proj_helix_console',
    buildId: 'build_002',
    kind: 'preview',
    status: 'ready',
    url: 'https://preview-pr42.console.helix.run',
    createdAt: builds[1].completedAt,
    updatedAt: builds[1].completedAt,
    commitMessage: 'runtime API hooks',
    author: 'ivy@helix.run',
    environment: 'preview',
    regionRollout: [
      { region: 'iad', status: 'ready' },
      { region: 'sfo', status: 'ready' },
    ],
  },
  {
    id: 'deploy_main_ai',
    projectId: 'proj_ai_docs',
    buildId: 'build_003',
    kind: 'production',
    status: 'ready',
    url: 'https://ai-docs.example.com',
    createdAt: builds[2].completedAt,
    updatedAt: builds[2].completedAt,
    commitMessage: 'chore: regen embeddings',
    author: 'sam@acme.io',
    environment: 'production',
    regionRollout: [
      { region: 'iad', status: 'ready' },
      { region: 'dub', status: 'ready' },
    ],
  },
]

export const store = {
  projects,
  deployments,
  builds,
}

export const listProjects = () => store.projects

export const findProject = (projectId: string) => store.projects.find(project => project.id === projectId)

export const listDeploymentsForProject = (projectId: string) =>
  store.deployments.filter(deployment => deployment.projectId === projectId)

export const appendDeployment = (deployment: Omit<Deployment, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newDeployment: Deployment = {
    ...deployment,
    id: nanoid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  store.deployments.unshift(newDeployment)
  publishDeploymentEvent({
    type: 'deploy',
    deploymentId: newDeployment.id,
    projectId: newDeployment.projectId,
    status: newDeployment.status,
    message: `Deployment recorded for ${newDeployment.environment}`,
    timestamp: newDeployment.updatedAt,
  })
  return newDeployment
}

export const findDeployment = (projectId: string, deploymentId: string) =>
  store.deployments.find(deployment => deployment.projectId === projectId && deployment.id === deploymentId)

export const recordRollback = (deploymentId: string, reason?: string) => {
  const deployment = store.deployments.find(item => item.id === deploymentId)
  if (!deployment) return null
  deployment.updatedAt = new Date().toISOString()
  deployment.status = 'ready'
  publishDeploymentEvent({
    type: 'rollback',
    deploymentId,
    projectId: deployment.projectId,
    status: deployment.status,
    message: `Rollback completed${reason ? `: ${reason}` : ''}`,
    timestamp: deployment.updatedAt,
  })
  return deployment
}

export const recordRestart = (deploymentId: string, scope: string = 'global') => {
  const deployment = store.deployments.find(item => item.id === deploymentId)
  if (!deployment) return null
  deployment.updatedAt = new Date().toISOString()
  deployment.status = 'building'
  publishDeploymentEvent({
    type: 'restart',
    deploymentId,
    projectId: deployment.projectId,
    status: deployment.status,
    message: `Restart initiated (${scope})`,
    timestamp: deployment.updatedAt,
  })

  setTimeout(() => {
    deployment.status = 'ready'
    deployment.updatedAt = new Date().toISOString()
    publishDeploymentEvent({
      type: 'restart',
      deploymentId,
      projectId: deployment.projectId,
      status: deployment.status,
      message: 'Restart completed',
      timestamp: deployment.updatedAt,
    })
  }, 2000)
  return deployment
}
