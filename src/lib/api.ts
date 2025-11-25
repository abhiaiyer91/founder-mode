import type { Deployment, Project } from '@helixstack/types'

export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:4000'

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const controlPlaneApi = {
  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE}/projects`)
    return handleResponse<Project[]>(response)
  },

  async getDeployments(projectId: string): Promise<Deployment[]> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/deployments`)
    return handleResponse<Deployment[]>(response)
  },

  async rollbackDeployment(projectId: string, deploymentId: string) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/deployments/${deploymentId}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'UI initiated rollback' }),
    })
    return handleResponse<{ message: string }>(response)
  },

  async restartDeployment(projectId: string, deploymentId: string) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/deployments/${deploymentId}/restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: 'global' }),
    })
    return handleResponse<{ message: string }>(response)
  },
}
