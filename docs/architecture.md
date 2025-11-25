## HelixStack Architecture

HelixStack mirrors the capabilities of Netlify/Vercel/Cloudflare while remaining portable across clouds. The platform is decomposed into planes that communicate via asynchronous events and well defined APIs.

---

### High-Level Data Flow

1. **Git push** triggers a webhook handled by the control plane.
2. Control plane schedules a build job on the build plane via NATS.
3. Build workers fetch source, execute dependency graph/buildpacks, and produce an artifact bundle (functions + static assets + metadata).
4. Artifact metadata is published back to the control plane, which creates a new deployment record.
5. Runtime plane pulls the artifact, materializes Node/Bun functions into Firecracker VMs or edge isolates, and registers routes with the delivery plane.
6. Delivery plane updates CDN routing + TLS and starts serving the new version.
7. Observability plane streams logs/metrics/traces for the deployment; insights feed back into the control plane UI.

---

### Planes & Responsibilities

#### Control Plane
- Fastify + GraphQL API backed by Postgres.
- Stores projects, environments, secrets, build logs metadata, policies.
- Publishes `build.requested`, `deploy.promoted`, `deploy.rolled_back` events.
- Embeds an authorization service (OPA/Rego) so orgs can insert policy.

#### Build Plane
- Pool of stateless workers running on Kubernetes or Nomad.
- Uses BuildKit + custom buildpacks (Node, Bun, Deno, static assets).
- Maintains artifact cache in OCI registry (e.g., Harbor, ECR).
- Exposes plug‑ins for SCM providers (GitHub, GitLab, Bitbucket).

#### Runtime Plane
- Manages execution sandboxes (Firecracker, gVisor, edge isolates).
- Warm pool manager predicts traffic via deploy metadata.
- Supports both request/response functions and background cron jobs.
- Integrates provider plug‑ins for cloud specific compute (Lambda, Cloud Run, Fly.io).

#### Delivery Plane
- CDN + global proxy (default: Cloudflare Workers + R2, fallback: Fastly).
- Handles TLS, custom domains, image optimization, cache invalidation.
- Implements programmable routing (headers, AB tests, experiments).

#### Observability Plane
- Central OTLP compatible collector.
- Streams logs and traces to Loki/Tempo; metrics to Prometheus/Cortex.
- Provides live tail streaming to the HelixStack console + CLI.

---

### Plug‑in Contracts

| Plug‑in Type | Purpose | Required Hooks |
| --- | --- | --- |
| **Provider** | Connect HelixStack to a cloud vendor | `register()`, `provision()`, `deploy()`, `destroy()` |
| **Buildpack** | Support new languages/frameworks | `detect()`, `compile()`, `release()` |
| **Runtime Adapter** | Replace default Firecracker/Bun runtime | `prepareVm()`, `deployFunctions()`, `collectLogs()` |
| **Observability Sink** | Mirror telemetry to 3rd party systems | `ingestLogs()`, `ingestMetrics()` |

Plug‑ins are shipped as OCI images. The control plane loads them dynamically and communicates over gRPC with protobuf contracts defined in `provider-sdk`.

---

### Multi-Cloud & On-Prem Strategy

- **State** – Postgres + Redis are the only stateful dependencies. Provide Helm charts and Terraform modules per cloud.
- **Secrets** – External secrets operator integrates with Vault, AWS Secrets Manager, GCP Secret Manager, etc.
- **Traffic** – Operators can start with a single CDN provider, then add more via weighted routing plugins.
- **Compliance** – Data residency enforced through region tags on deployments; build artifacts carry residency metadata to prevent cross-region promotion.

---

### Security Considerations

- Keyless signing for build artifacts (Fulcio + Rekor) to guarantee provenance.
- Separation between project-scoped secrets and provider credentials.
- Every plug‑in executes inside its own sandbox (Wasm or container) with limited RBAC.
- Audit log stream emitted for any secret access, deploy promote, rollback, or plugin upgrade.

---

### Open Questions

1. Should the runtime plane expose WebSockets/long-lived connections or delegate to a managed pub/sub service?
2. What is the minimal viable provider interface to support the “run anywhere” promise without over-fitting to Kubernetes?
3. How aggressively should we optimize for cold-start times in Bun vs. Node 22?

These topics are tracked in GitHub Discussions and RFCs referenced from `docs/roadmap.md`.
