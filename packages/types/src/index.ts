export type DeploymentStatus = 'building' | 'ready' | 'failed'
export type DeploymentKind = 'preview' | 'production'

export interface Build {
  id: string
  projectId: string
  commitSha: string
  branch: string
  command: string
  startedAt: string
  completedAt: string
  status: 'running' | 'succeeded' | 'failed'
  artifactUrl: string
}

export interface Deployment {
  id: string
  projectId: string
  buildId: string
  kind: DeploymentKind
  status: DeploymentStatus
  url: string
  createdAt: string
  updatedAt: string
  commitMessage: string
  author: string
  environment: 'preview' | 'production'
  regionRollout: Array<{
    region: string
    status: DeploymentStatus
  }>
}

export interface Project {
  id: string
  name: string
  repoUrl: string
  defaultBranch: string
  buildCommand: string
  startCommand: string
  provider: string
  lastDeployAt: string
  previewDomain: string
  productionDomain: string
  organizationId?: string | null
  organizationName?: string | null
}

export interface RollbackPayload {
  reason?: string
}

export interface RestartPayload {
  scope?: 'global' | 'region'
  region?: string
}

export interface DeploymentEvent {
  type: 'restart' | 'rollback' | 'deploy'
  deploymentId: string
  projectId: string
  status: DeploymentStatus
  message: string
  timestamp: string
}
