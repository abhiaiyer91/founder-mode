import { useEffect, useMemo, useState } from 'react'
import type { Deployment, Project } from '@helixstack/types'
import { controlPlaneApi } from '../lib/api'

interface ControlPlaneState {
  projects: Project[]
  deployments: Deployment[]
  selectedProjectId: string | null
  loading: boolean
  error: string | null
  selectProject: (projectId: string) => void
  refreshDeployments: () => Promise<void>
}

export const useControlPlane = (): ControlPlaneState => {
  const [projects, setProjects] = useState<Project[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  }
}
