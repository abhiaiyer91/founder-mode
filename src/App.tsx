import { useMemo, useState } from 'react'
import type { Deployment } from '@helixstack/types'
import { useControlPlane } from './hooks/useControlPlane'
import { controlPlaneApi } from './lib/api'
import './App.css'

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(value))

const environmentLabel: Record<string, string> = {
  production: 'Production',
  preview: 'Preview',
}

function App() {
  const {
    projects,
    deployments,
    selectedProjectId,
    selectProject,
    loading,
    error,
    refreshDeployments,
    lastEventMessage,
  } = useControlPlane()
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const selectedProject = useMemo(
    () => projects.find(project => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  const previewDeployments = deployments.filter(deployment => deployment.environment === 'preview')
  const productionDeployments = deployments.filter(deployment => deployment.environment === 'production')

  const handleAction = async (deployment: Deployment, intent: 'restart' | 'rollback') => {
    if (!selectedProjectId) return
    setActionLoading(true)
    try {
      const response =
        intent === 'restart'
          ? await controlPlaneApi.restartDeployment(selectedProjectId, deployment.id)
          : await controlPlaneApi.rollbackDeployment(selectedProjectId, deployment.id)
      setActionMessage(response.message)
      await refreshDeployments()
    } catch (err) {
      setActionMessage((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const renderDeploymentCard = (deployment: Deployment) => (
    <article key={deployment.id} className="deployment-card">
      <div className="deployment-card__header">
        <span className={`status-pill ${deployment.status}`}>{deployment.status}</span>
        <span className="deployment-env">{environmentLabel[deployment.environment] ?? deployment.environment}</span>
      </div>
      <h4>{deployment.commitMessage}</h4>
      <p className="deployment-meta">
        {deployment.author} • {formatDate(deployment.updatedAt)}
      </p>
      <p className="deployment-url">{deployment.url}</p>
      <div className="deployment-actions">
        <button
          className="btn primary small"
          disabled={actionLoading}
          onClick={() => handleAction(deployment, 'restart')}
        >
          Restart runtime
        </button>
        {deployment.environment === 'production' && (
          <button
            className="btn ghost small"
            disabled={actionLoading}
            onClick={() => handleAction(deployment, 'rollback')}
          >
            Rollback
          </button>
        )}
      </div>
    </article>
  )

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">HelixStack control plane</p>
          <h1>Projects dashboard</h1>
        </div>
        <div className="connection-status">
          <span className={`connection-dot ${error ? 'error' : 'ok'}`} />
          <span>{error ? 'Control plane unreachable' : 'Live updates active'}</span>
        </div>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Projects</h2>
            <span>{projects.length}</span>
          </div>
          <div className="project-list">
            {loading && projects.length === 0 && <p className="muted">Loading projects…</p>}
            {projects.map(project => (
              <button
                key={project.id}
                className={`project-item ${selectedProjectId === project.id ? 'active' : ''}`}
                onClick={() => selectProject(project.id)}
              >
                <div>
                  <p className="project-name">{project.name}</p>
                  <span className="project-provider">{project.provider}</span>
                </div>
                <span className="project-branch">{project.defaultBranch}</span>
              </button>
            ))}
            {!loading && projects.length === 0 && (
              <p className="muted">Start the control plane server to seed demo projects.</p>
            )}
          </div>
        </aside>

        <main className="content">
          {error && <div className="error-banner">Control plane unavailable: {error}</div>}

          {selectedProject ? (
            <>
              <section className="project-overview">
                <div className="overview-grid">
                  <article>
                    <p className="eyebrow">Repository</p>
                    <a href={selectedProject.repoUrl} target="_blank" rel="noreferrer">
                      {selectedProject.repoUrl}
                    </a>
                  </article>
                  <article>
                    <p className="eyebrow">Default branch</p>
                    <p>{selectedProject.defaultBranch}</p>
                  </article>
                  <article>
                    <p className="eyebrow">Build command</p>
                    <p>{selectedProject.buildCommand}</p>
                  </article>
                  <article>
                    <p className="eyebrow">Start command</p>
                    <p>{selectedProject.startCommand}</p>
                  </article>
                  <article>
                    <p className="eyebrow">Preview domain</p>
                    <p>{selectedProject.previewDomain}</p>
                  </article>
                  <article>
                    <p className="eyebrow">Production domain</p>
                    <p>{selectedProject.productionDomain}</p>
                  </article>
                  <article>
                    <p className="eyebrow">Organization</p>
                    <p>{selectedProject.organizationName ?? 'Unassigned'}</p>
                  </article>
                </div>
              </section>

              <section className="deployments-panel">
                <div>
                  <div className="panel-header">
                    <h3>Production</h3>
                    <span>{productionDeployments.length} records</span>
                  </div>
                  <div className="deployment-list">
                    {productionDeployments.length === 0 && <p className="muted">No production deploys yet.</p>}
                    {productionDeployments.map(renderDeploymentCard)}
                  </div>
                </div>
                <div>
                  <div className="panel-header">
                    <h3>Previews</h3>
                    <span>{previewDeployments.length} branches</span>
                  </div>
                  <div className="deployment-list">
                    {previewDeployments.length === 0 && <p className="muted">Ship a PR to see data.</p>}
                    {previewDeployments.map(renderDeploymentCard)}
                  </div>
                </div>
              </section>

              <section className="activity-feed">
                <div className="panel-header">
                  <h3>Activity</h3>
                  <span>Latest event</span>
                </div>
                {actionMessage && <p className="action-message">{actionMessage}</p>}
                {lastEventMessage && <p className="action-message">{lastEventMessage}</p>}
                {!actionMessage && !lastEventMessage && <p className="muted">Waiting for events…</p>}
              </section>
            </>
          ) : (
            <div className="empty-state">
              <h3>No project selected</h3>
              <p>Pick a project from the left rail to inspect its deployments.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
