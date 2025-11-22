## Deployment Flow

This document walks through how HelixStack handles the repo → build → deploy lifecycle while keeping previews, production releases, rollbacks, and restarts entirely automated.

---

### 1. Connect a Repository

1. User authenticates with GitHub/GitLab/Bitbucket via OAuth.
2. Control plane creates a Project linked to the repo and stores:
   - Repo URL + default branch (usually `main`).
   - Build command (`helix build` or user-provided `pnpm build`).
   - Start command (`helix run` / `pnpm start`) for long-lived workloads.
3. Optional: configure environment variables and secrets (scoped per environment) and select a runtime provider plug-in.

---

### 2. Detect Events

- **Pull Requests / Merge Requests** fire `deployment.preview.requested`.
- **Pushes to default branch** fire `deployment.production.requested`.
- Manual redeploys or restarts can be triggered from the console/CLI and emit `deployment.restart.requested`.

All events land in NATS JetStream where the build plane picks them up.

---

### 3. Build Phase

1. Worker clones the repo at the commit SHA.
2. Dependency install (Node, Bun, Deno) leverages shared cache layers.
3. Runs the configured build command or falls back to framework detection (Next.js, Remix, Astro, etc.).
4. Emits an artifact bundle: static assets, serverless/edge functions, metadata (routes, env vars), and provenance attestations.
5. Artifacts are stored in an OCI registry and versioned by commit SHA + environment.

Preview builds are labeled `preview/<pr-number>`; production builds are labeled `main/<deploy-number>`.

---

### 4. Deploy Phase

| Flow | Target | Behavior |
| --- | --- | --- |
| **Preview deploy** | `preview.<project>.helix.run` | Each PR gets an isolated runtime namespace. Promote/demote rules ensure nothing leaks to production. |
| **Production deploy** | `project.com` or custom domain | Ship artifacts built from the default branch, with zero-downtime global rollout across the delivery plane. |
| **Manual restart** | Any environment | Rehydrates the runtime using the *existing* artifact (no rebuild) to pick up configuration/routing changes. |

Deployments are atomic: new traffic only flows once health checks pass, otherwise the platform auto-rolls back to the prior stable version.

---

### 5. Rollbacks

- Control plane tracks deployment history with links to artifact SHAs.
- Rolling back promotes a previously known good artifact without triggering the build plane.
- Rollbacks can be scoped:
  - **Full rollback** – revert production globally.
  - **Regional rollback** – revert specific regions while keeping others on the latest release.
  - **Preview rollback** – re-issue the last successful preview build (useful when PR tests regress).

Every rollback emits `deployment.rolled_back` and pushes notifications to the console, CLI, and webhooks.

---

### 6. Restarts

Restarts are lightweight actions useful after:

- Updating environment variables.
- Rotating secrets, provider credentials, or runtime plug-ins.
- Resizing runtime resources (CPU/memory).

On restart, the runtime plane:

1. Drains in-flight connections (graceful shutdown).
2. Rehydrates workers/VMs using the latest deployed artifact.
3. Reattaches log/metrics streams.

No builds or rebuilds occur; it’s an operational control triggered through the UI, CLI, or API.

---

### 7. Promotion Workflow Summary

```
git push feature -> preview deploy
      |
      v
QA/Stakeholders approve preview
      |
      v
Merge to main -> production deploy
      |
      +--> restart (optional) to apply config changes
      |
      +--> rollback (if errors) -> select previous artifact
```

This flow mirrors Netlify/Vercel ergonomics while keeping every step portable across clouds thanks to HelixStack’s plug-in architecture.
