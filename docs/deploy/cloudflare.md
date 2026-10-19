# Deploying to Cloudflare Workers (optional target)

The primary target is Node + Docker + Postgres (see the root `Dockerfile`). Cloudflare Workers
is a supported **future** target: the code is already split so that the API core never touches
Node APIs, but the Worker runtime itself is **not implemented yet**. What exists today:

| Piece | Status |
|---|---|
| Platform-neutral API (`createApp(deps)`), env parsing (`parseEnv(source)`) | Done — shared with Node |
| `backend/wrangler.jsonc` (assets, bindings, vars) | Placeholder — bindings commented out, ids missing |
| `backend/src/runtime/cloudflare/` (Worker entry + bootstrap) | Not implemented — see its README |
| `backend/src/infra/d1/kysely-d1.ts` (Kysely dialect for D1) | Vendored, kept on purpose instead of a third-party package; excluded from the Node build |
| KV / object storage / job-dispatch ports | Not implemented on either platform yet |

## Checklist

### 1. Choose the database

- **Postgres via Hyperdrive (recommended).** Same schema, same Kysely migrations, same
  `createPostgresDb()` (`pg` works on Workers with `nodejs_compat`, which is on by default for
  `compatibility_date >= 2026-08-04`). Create a Hyperdrive config pointing at your Postgres
  and uncomment the `hyperdrive` block in `wrangler.jsonc`.
- **D1 (SQLite).** Use `D1Dialect` from `infra/d1/kysely-d1.ts`, `createAuth(db, "sqlite", env)`,
  and SQLite-dialect migrations (step 6). D1 has no interactive transactions — the adapter
  turns `BEGIN/COMMIT/ROLLBACK` into no-ops with a warning; use D1 `batch()` for atomic writes.

### 2. Add the Cloudflare tooling

```bash
npm i -D -w backend wrangler
```

```bash
npx --workspace backend wrangler types
```

`wrangler types` writes `backend/worker-configuration.d.ts` (runtime types + your bindings as
the global `Env`). Add `backend/tsconfig.worker.json` — same options as `tsconfig.core.json`
plus `"types": ["./worker-configuration.d.ts"]`, including `src/runtime/cloudflare` and
`src/infra/d1` — and reference it from `backend/tsconfig.json`.

### 3. Implement the Worker runtime

Follow `backend/src/runtime/cloudflare/README.md`: `worker.ts` (`fetch` → `createApp(deps)`,
later `queue`) and `bootstrap.ts` (`parseEnv(env)`, Kysely, `createAuth`). Bindings exist only
per request/isolate, so build dependencies inside the handler (cache per isolate if needed).

### 4. Configuration and secrets

- Fill in `wrangler.jsonc`: uncomment the bindings you use, set ids, set `vars.BETTER_AUTH_URL`
  to the Worker's public origin.
- Local secrets go in `backend/.dev.vars` (git-ignored); production secrets via
  `npx wrangler secret put BETTER_AUTH_SECRET` (and `OIDC_CLIENT_SECRET`, …).
- Register the redirect URI `<BETTER_AUTH_URL>/api/auth/callback/oidc` at the OIDC provider.

### 5. Static assets

`npm run build` (repo root) produces `frontend/dist`; `wrangler.jsonc` uploads it as Workers
Static Assets (`assets.directory: "../frontend/dist"`). Asset requests are served without
invoking the Worker; `run_worker_first: ["/api/*"]` sends the API to Hono, and
`not_found_handling: "single-page-application"` serves `index.html` for client routes.

Suggested scripts once the runtime exists (in `backend/package.json`):

| Script | Command |
|---|---|
| `dev:cf` | `wrangler dev` (after `npm run build -w frontend`) |
| `deploy:cf` | `wrangler deploy` (after the root `npm run build`) |

### 6. Migrations

- **Hyperdrive/Postgres:** nothing new — run `npm run db:migrate` against that database from
  the deploy pipeline (see `docs/backend/runbook.md`).
- **D1:** Kysely cannot reach a remote D1 from Node, so D1 uses
  `wrangler d1 migrations apply` with plain SQL files in `backend/db/d1/`
  (`migrations_dir` in `wrangler.jsonc`). Keep the Kysely timeline as the single source: generate
  each D1 SQL file by running the Kysely migrations against a local SQLite database
  (`node:sqlite`) and capturing the emitted DDL; generate Better Auth's SQLite SQL with
  `npx auth generate` against a SQLite-backed `auth.ts`. This generator script is not written yet.

### 7. Background jobs, KV, object storage

Long-running work (e.g. agent runs) must not live inside a request: the planned design is
"queue delivery + our own step state machine", where the platform only delivers "continue job X"
(Cloudflare Queues on Workers, an in-process dispatcher on Node). KV (Cloudflare KV vs.
in-memory on Node) and object storage (R2 binding vs. S3 on Node) follow the same port pattern.
None of these ports exist yet; add them under `backend/src/ports/` with implementations in
`backend/src/infra/` when the first feature needs them.
