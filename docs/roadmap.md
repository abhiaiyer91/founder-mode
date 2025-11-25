## HelixStack Roadmap

Roadmap is organized as a sequence of deliverables that bring HelixStack from concept to a deployable platform. Dates assume a small core team; adjust according to contributors.

---

### Milestone 0 — Foundations (Weeks 1-2)
- Finalize product spec, plug-in contracts, and licensing.
- Set up monorepo structure, package tooling, linting, and CI (Lint, Test, Typecheck).
- Build UX prototype (this React app) covering project dashboard, deployments list, and provider settings.

### Milestone 1 — Minimum Deploy (Weeks 3-6)
- Implement control plane API (Fastify + Postgres).
- Implement GitHub webhook ingestion + project linking.
- Ship basic build plane workers using Docker + BuildKit inside Kubernetes.
- Deliver provider SDK skeleton with example “local docker” runtime plug‑in.
- Primitive CLI (`helix dev`, `helix deploy`) that hits the control plane.

### Milestone 2 — Runtime + CDN (Weeks 7-10)
- Add Firecracker-based runtime manager with Bun + Node options.
- Implement preview URLs + branch deployments.
- Integrate Cloudflare (or Fastly) as first delivery plane plug‑in.
- Provide secrets manager (Vault) integration with per-project scopes.
- Capture deployment logs and surface them in the console + CLI.

### Milestone 3 — Multi-Cloud + Observability (Weeks 11-15)
- Add AWS Lambda and Fly.io provider plug‑ins.
- Ship OTLP collector + Loki/Tempo stack with live tail streaming.
- Provide policy engine for deployment guardrails (OPA/Rego).
- Add analytics (traffic, latency, errors) with per-deploy breakdown.

### Milestone 4 — Enterprise Readiness (Weeks 16-20)
- Organization RBAC, SSO (Okta, Entra ID).
- Audit log export and compliance reports.
- Quotas, budgets, and automated scale-to-zero.
- Build marketplace for provider/buildpack plug‑ins with validation pipeline.

### Ongoing Backlog Ideas
- Deno/Fresh and Rust (WASM) buildpacks.
- Scheduled jobs + queue workers.
- Edge data (KV or Durable Objects equivalent).
- Cost insights + anomaly detection.
- Drift detection for self-hosted operators.

---

## Contribution Workflow

1. Pick an issue tagged with the current milestone.
2. Create an RFC for any change touching plug‑in contracts, security, or platform planes.
3. Provide automated tests (unit/integration) before requesting review.
4. Update documentation when adding or modifying plug‑ins.
