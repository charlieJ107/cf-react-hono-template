# runtime/cloudflare — placeholder

The Cloudflare Workers runtime is **not implemented yet**. This folder is where it goes; it is
excluded from the Node build (`tsconfig.node.json`) and will get its own `tsconfig.worker.json`.

What it has to provide, mirroring `runtime/node/`:

- `worker.ts` — the Worker entry (`main` in `backend/wrangler.jsonc`):
  - `fetch`: build the dependencies from the Worker `env` bindings and serve `createApp(deps)`.
    Static assets are served by Workers Static Assets before the Worker runs, so there is no
    `serveStatic` here.
  - `queue`: consume "continue job X" messages for background jobs (when jobs exist).
- `bootstrap.ts` — assemble `AppDeps` from bindings:
  - `parseEnv(env)` (the same zod schema; it takes the binding object, never `process.env`);
  - a Kysely instance — Postgres via Hyperdrive (`createPostgresDb(env.HYPERDRIVE.connectionString)`)
    or D1 (`new Kysely({ dialect: new D1Dialect({ database: env.DB }) })`, see `infra/d1/`);
  - `createAuth(db, "postgres" | "sqlite", env)`. Bindings only exist per request/isolate, so
    create (or lazily cache per isolate) these inside the handler, not at module scope.

Step-by-step checklist: [`docs/deploy/cloudflare.md`](../../../../docs/deploy/cloudflare.md).
