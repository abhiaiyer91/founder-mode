# HelixStack — Pluggable Node Server Deployment Platform

HelixStack is an open source platform that delivers the experience of Netlify, Vercel, or Cloudflare Workers while keeping the entire deployment architecture portable to any cloud or on‑prem environment. The goal is to provide a modern developer experience (instant previews, atomic deploys, global edge runtime) combined with a modular control plane that operators can host wherever they need.

> **Status:** Design/Prototype. This repo currently tracks the product vision, UI experiments, and architectural assets while the core services are implemented.

---

## Why HelixStack?

- **Neutral architecture** – No hard dependency on a single cloud vendor; every subsystem is deployable on Kubernetes, Nomad, ECS, or bare metal.
- **Node-first workflow** – Automatic builds for Node/TypeScript projects, but extensible to other runtimes through plug‑ins.
- **Composable surfaces** – Build plane, runtime plane, CDN/edge, and observability are all replaceable modules.
- **Operator-friendly** – GitOps-ready configuration, policy hooks, and clear SLOs for each subsystem.
- **Developer joy** – Git integrations, preview URLs, logs/metrics streaming, instant rollbacks.

---

## Platform Overview

| Plane | Responsibilities | Default implementation | Pluggable via |
| --- | --- | --- | --- |
| **Control Plane** | Projects, builds, secrets, deployments, policy | Node (Fastify) + Postgres | gRPC/REST adapters |
| **Build Plane** | Source cloning, dependency graph, caching, artifact publish | BuildKit + Turborepo workers | OCI buildpack drivers |
| **Runtime Plane** | Execute SSR/Edge functions, manage Node pools, cold start mitigation | Firecracker micro‑VMs + Bun runtime | Runtime provider plug‑in |
| **Delivery Plane** | CDN, TLS, routing rules, cache invalidation | Cloudflare Workers + R2 | CDN provider plug‑in |
| **Observability** | Logs, traces, metrics, deploy events | Tempo + Loki + Prometheus | OTLP sinks |

Each plane communicates via a message bus (NATS JetStream) and shares metadata through the control plane API. Operators may swap planes by implementing the corresponding plug‑in contract.

---

## Plug‑in Model

- **Provider SDK** – A TypeScript interface that defines lifecycle hooks (`prepare()`, `deploy()`, `promote()`, `cleanup()`).
- **Secrets & Config** – Plug‑ins request secrets through a scoped vault broker; no direct cloud credentials stored in the core DB.
- **Runtime Extensions** – Developers can package middleware (edge handlers, request transforms) that run before/after user functions.
- **Policy Hooks** – Organizations inject policies (allowed regions, budget limits) that run during the deploy pipeline.

---

## Deployment Flow

Connecting a repo gives HelixStack enough information to run your build or custom start command. Every PR automatically creates an isolated preview deployment, and merges to `main` promote artifacts to production with zero downtime. Operators can trigger manual restarts (reuse the last artifact but refresh the runtime) or rollbacks (promote a previously successful artifact) without touching the build plane.

See `docs/deployment-flow.md` for the full event sequence covering repo connection, build, preview deploys, production releases, rollbacks, and restarts.

---

## Repository Layout (planned)

```
packages/
  control-plane/         # Fastify API + GraphQL facade
  build-plane/           # Workers orchestrating BuildKit
  runtime-plane/         # VM/Function manager
  provider-sdk/          # Plug-in contracts + scaffolding
apps/
  console/               # React dashboard (this repo today)
  cli/                   # helix CLI for local dev + deploys
infra/
  helm/                  # Helm charts + Kustomize overlays
docs/
  architecture.md
  roadmap.md
```

The current repo hosts the console app and documentation. Future milestones will flesh out each package as the architecture solidifies.

---

## Getting Started (UI Prototype)

```bash
pnpm install
pnpm dev
```

The development server boots the HelixStack console prototype where we iterate on UX for project management, deploy logs, and provider configuration.

---

## Contributing

1. Check `docs/roadmap.md` for the current milestone and open issues.
2. File design proposals as GitHub Discussions before starting complex features.
3. Ensure new plug‑ins include integration tests via the provider SDK test harness.

---

## Control Plane Dev Server

A Fastify-based control-plane skeleton lives in `packages/control-plane`.

```bash
# Start the API server
pnpm --filter @helixstack/control-plane dev

# Build for production
pnpm --filter @helixstack/control-plane build
```

Available routes (all in-memory data for now):

- `GET /healthz` – health probe.
- `GET /projects` – list seeded projects with repo + command metadata.
- `GET /projects/:projectId/deployments` – preview & production history.
- `POST /projects/:projectId/deployments/:deploymentId/rollback` – simulates rollback.
- `POST /projects/:projectId/deployments/:deploymentId/restart` – simulates restart.
- `POST /webhooks/github` – placeholder for webhook ingestion.

> The React console reads live data from these endpoints. Set `VITE_API_BASE_URL` (defaults to `http://localhost:4000`) when running `pnpm dev` so the UI can reach your control plane instance.

---

## License

Apache 2.0 (to be finalized). Contributions are welcome once the governance doc is published.
