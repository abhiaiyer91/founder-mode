import { useEffect, useMemo, useState } from 'react'
import type { Deployment, DeploymentEvent, Project } from '@helixstack/types'
import { API_BASE, controlPlaneApi } from '../lib/api'

interface ControlPlaneState {
  projects: Project[]
  deployments: Deployment[]
  selectedProjectId: string | null
  loading: boolean
  error: string | null
  selectProject: (projectId: string) => void
  refreshDeployments: () => Promise<void>
  lastEventMessage: string | null
}

export const useControlPlane = (): ControlPlaneState => {
  const [projects, setProjects] = useState<Project[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastEventMessage, setLastEventMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const fetchProjects = async () => {
      setLoading(true)
      try {
        const data = await controlPlaneApi.getProjects()
        if (!active) return
        setProjects(data)
        setSelectedProjectId(currentId => currentId ?? data[0]?.id ?? null)
        setError(null)
      } catch (err) {
        console.error(err)
        if (active) setError((err as Error).message)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchProjects()
    return () => {
      active = false
    }
  }, [])

  const refreshDeployments = useMemo(
    () => async () => {
      if (!selectedProjectId) return
      try {
        const data = await controlPlaneApi.getDeployments(selectedProjectId)
        setDeployments(data)
        setError(null)
      } catch (err) {
        console.error(err)
        setError((err as Error).message)
      }
    },
    [selectedProjectId],
  )

  useEffect(() => {
    refreshDeployments()
  }, [refreshDeployments])

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedProjectId) return
    const source = new EventSource(`${API_BASE}/events/deployments`)

    const handleDeploymentEvent = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as DeploymentEvent
        if (payload.projectId !== selectedProjectId) return
        let matched = false
        setDeployments(prev => {
          const next = prev.map(deployment => {
            if (deployment.id !== payload.deploymentId) return deployment
            matched = true
            return {
              ...deployment,
              status: payload.status,
              updatedAt: payload.timestamp,
            }
          })
          return next
        })
        if (!matched) {
          void refreshDeployments()
        }
        setLastEventMessage(payload.message)
      } catch (err) {
        console.error('Invalid deployment event payload', err)
      }
    }

    source.addEventListener('deployment', handleDeploymentEvent as EventListener)
    source.onerror = () => {
      setLastEventMessage('Live updates reconnecting…')
    }

    return () => {
      source.removeEventListener('deployment', handleDeploymentEvent as EventListener)
      source.close()
    }
  }, [selectedProjectId, refreshDeployments])

  const selectProject = (projectId: string) => {
    setSelectedProjectId(projectId)
  }

  return {
    projects,
    deployments,
    selectedProjectId,
    loading,
    error,
    selectProject,
    refreshDeployments,
    lastEventMessage,
  }
}
