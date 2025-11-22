import './App.css'

const pillars = [
  {
    title: 'Run anywhere',
    description: 'Install the HelixStack control plane on any Kubernetes, Nomad, or bare-metal cluster. Swap planes without re‑architecting the whole system.',
  },
  {
    title: 'Node-first DX',
    description: 'Ship SSR, edge functions, cron jobs, and background workers with a single pipeline optimised for Node, Bun, and TypeScript projects.',
  },
  {
    title: 'Pluggable everything',
    description: 'Providers, runtimes, buildpacks, and observability sinks are all replaceable modules with a stable TypeScript SDK.',
  },
]

const features = [
  { name: 'Git-native deploys', detail: 'Atomic deploys for every commit, branch previews, instant rollbacks.', badge: 'Build plane' },
  { name: 'Edge + VM runtime', detail: 'Run latency-sensitive code on isolates or Firecracker micro-VMs.', badge: 'Runtime plane' },
  { name: 'Programmable routing', detail: 'Flow traffic by headers, cookies, geography, or scheduled rules.', badge: 'Delivery plane' },
  { name: 'Observability fan-out', detail: 'Live tail logs, OTLP traces, and metrics streaming to any sink.', badge: 'Observability' },
  { name: 'Policy guardrails', detail: 'OPA/Rego hooks enforce budgets, residency, and review requirements.', badge: 'Control plane' },
  { name: 'Provider marketplace', detail: 'Publish plug-ins for AWS, Fly, Cloudflare, or your own infra.', badge: 'Plug-ins' },
]

const architecture = [
  { title: 'Control Plane', stack: 'Fastify, Postgres, Redis', summary: 'Projects, secrets, deployments, policy evaluation, and event fan-out via NATS JetStream.' },
  { title: 'Build Plane', stack: 'BuildKit, Turborepo, OCI registry', summary: 'Source cloning, caching, artifact signing, and provenance attestations.' },
  { title: 'Runtime Plane', stack: 'Firecracker, Bun/Node 22', summary: 'Cold-start aware scheduler, edge isolates, cron orchestrator, and log drains.' },
  { title: 'Delivery Plane', stack: 'Cloudflare/Fastly adapters', summary: 'TLS, CDN, programmable routing, cache invalidation, and streaming optimizations.' },
]

const flowSteps = [
  {
    title: 'Connect repo',
    detail: 'OAuth with GitHub/GitLab, choose a project, and declare the build/start commands HelixStack should execute.',
    note: 'Supports custom scripts like `pnpm build` or `npm run start`.',
  },
  {
    title: 'Build & attest',
    detail: 'Workers clone the commit, run dependency install, execute your build/start command, and store signed artifacts in an OCI registry.',
    note: 'Cache-aware, framework autodetection, provenance via Sigstore.',
  },
  {
    title: 'PR preview deploy',
    detail: 'Every pull request spins up an isolated namespace with its own URL, secrets, and runtime limits.',
    note: 'Tear down automatically when the PR closes.',
  },
  {
    title: 'Ship to main',
    detail: 'Merges promote artifacts to production with zero-downtime rollouts across every region and CDN POP.',
    note: 'Health checks gate traffic; failures auto-roll back.',
  },
]

const pluginTypes = [
  { title: 'Provider SDK', hooks: 'register → provision → deploy → destroy' },
  { title: 'Buildpack SDK', hooks: 'detect → compile → release' },
  { title: 'Runtime Adapter', hooks: 'prepareVm → deployFunctions → collectLogs' },
  { title: 'Observability Sink', hooks: 'ingestLogs → ingestMetrics → ingestTraces' },
]

const operationalControls = [
  {
    title: 'Rollbacks',
    description: 'Select any previous artifact (preview or production) and promote it instantly without re-running the build pipeline.',
    meta: 'Region-scoped or global.',
  },
  {
    title: 'Restarts',
    description: 'Rehydrate runtimes using the current artifact to pick up secret rotations, env changes, or runtime patches.',
    meta: 'No rebuild required.',
  },
  {
    title: 'Redeploy',
    description: 'Kick off a fresh build from the same commit if dependencies or plug-ins changed after the initial run.',
    meta: 'CLI, API, or UI.',
  },
]

const milestones = [
  { label: 'Milestone 0', detail: 'Repo + UX prototype + plug-in contracts (Weeks 1-2).' },
  { label: 'Milestone 1', detail: 'Control plane, build workers, CLI, local provider (Weeks 3-6).' },
  { label: 'Milestone 2', detail: 'Edge runtime, CDN integration, secrets, logs (Weeks 7-10).' },
  { label: 'Milestone 3', detail: 'Multi-cloud providers, observability stack, policy engine (Weeks 11-15).' },
]

function App() {
  return (
    <div className="app">
      <header className="hero">
        <div className="badge">Open-source deployment platform</div>
        <h1>HelixStack</h1>
        <p className="subtitle">
          Ship Node apps with the ergonomics of Vercel and the freedom to run on any cloud. HelixStack splits build,
          runtime, delivery, and observability planes so operators can compose their own stack without sacrificing
          developer experience.
        </p>
        <div className="cta-group">
          <a className="cta primary" href="https://github.com/abhiaiyer91/vite-project" target="_blank" rel="noreferrer">
            View on GitHub
          </a>
          <a
            className="cta ghost"
            href="https://github.com/abhiaiyer91/vite-project/blob/main/docs/architecture.md"
            target="_blank"
            rel="noreferrer"
          >
            Read the architecture
          </a>
        </div>
      </header>

      <section className="pillars">
        {pillars.map(pillar => (
          <article key={pillar.title}>
            <h3>{pillar.title}</h3>
            <p>{pillar.description}</p>
          </article>
        ))}
      </section>

      <section className="feature-grid">
        <div className="section-heading">
          <p className="eyebrow">Capabilities</p>
          <h2>Everything you expect from Netlify/Vercel, but portable.</h2>
        </div>
        <div className="grid">
          {features.map(feature => (
            <article key={feature.name}>
              <span className="badge subtle">{feature.badge}</span>
              <h3>{feature.name}</h3>
              <p>{feature.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="architecture">
        <div className="section-heading">
          <p className="eyebrow">Planes</p>
          <h2>Composable control, build, runtime, delivery.</h2>
        </div>
        <div className="grid">
          {architecture.map(layer => (
            <article key={layer.title}>
              <div className="layer-header">
                <h3>{layer.title}</h3>
                <span>{layer.stack}</span>
              </div>
              <p>{layer.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="deployment-flow">
        <div className="section-heading">
          <p className="eyebrow">Flow</p>
          <h2>Connect repo → run your build/start command → deploy.</h2>
          <p className="flow-subtitle">
            HelixStack mirrors your existing scripts. Previews spin up for every PR; merges to main go straight to production with automatic rollbacks and restarts.
          </p>
        </div>
        <div className="flow-grid">
          {flowSteps.map(step => (
            <article key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
              <span>{step.note}</span>
            </article>
          ))}
        </div>
        <div className="ops-grid">
          {operationalControls.map(control => (
            <article key={control.title}>
              <h3>{control.title}</h3>
              <p>{control.description}</p>
              <span>{control.meta}</span>
            </article>
          ))}
        </div>
        <a
          className="cta inline"
          href="https://github.com/abhiaiyer91/vite-project/blob/main/docs/deployment-flow.md"
          target="_blank"
          rel="noreferrer"
        >
          Explore the full deployment flow →
        </a>
      </section>

      <section className="plugins">
        <div className="section-heading">
          <p className="eyebrow">SDK</p>
          <h2>Plug-ins keep HelixStack cloud-agnostic.</h2>
        </div>
        <div className="plugin-cards">
          {pluginTypes.map(type => (
            <article key={type.title}>
              <h3>{type.title}</h3>
              <p>{type.hooks}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="roadmap">
        <div className="section-heading">
          <p className="eyebrow">Roadmap</p>
          <h2>Open milestones for contributors.</h2>
        </div>
        <div className="timeline">
          {milestones.map(milestone => (
            <article key={milestone.label}>
              <h3>{milestone.label}</h3>
              <p>{milestone.detail}</p>
            </article>
          ))}
        </div>
        <a
          className="cta inline"
          href="https://github.com/abhiaiyer91/vite-project/blob/main/docs/roadmap.md"
          target="_blank"
          rel="noreferrer"
        >
          Read the detailed roadmap →
        </a>
      </section>
    </div>
  )
}

export default App
