# cf-react-hono-template

A full-stack TypeScript template: a React SPA and a Hono API in one npm-workspaces repo,
Postgres via Kysely, and Better Auth signing users in through any OpenID Connect provider.
The primary deployment target is **Node + Docker + Postgres**; **Cloudflare Workers** is an
optional target the code is structured for (see [Cloudflare](#cloudflare-workers-optional)).

## Features

| | |
|---|---|
| Same origin | The API and the SPA share one origin (Vite proxy in dev, one server/image in prod) — no CORS |
| End-to-end types | The frontend calls the API through Hono RPC (`hc<AppType>`) with types read straight from backend source |
| Auth | Better Auth 1.7: OIDC sign-in (`genericOAuth`), `admin`, `apiKey`, `bearer`, cookie session cache, versioned secrets |
| One migration timeline | Kysely migrations (kysely-ctl); Better Auth only *generates* SQL that a migration executes verbatim |
| Platform-neutral core | API core is compiled and linted against Web-standard APIs only; platforms inject drivers |
| UI | React 19, Vite 8, Tailwind CSS 4, shadcn (`base-vega`, Base UI), React Router 8 as a library, SWR |
| App shell | Landing page, auth guards, collapsible sidebar, user menu with theme switch, profile page (`/me`) |
| Tooling | TypeScript 7, Oxlint, Vitest, a Docker image, GitHub Actions CI |

## Structure

```text
.env.example            the one project .env (copy to .env)
frontend/               React SPA (Vite) — src/app (router, shell), src/features, src/api
backend/                Hono API
  src/app.ts            createApp(deps) — the platform-neutral API; exports AppType
  src/{routes,http,auth,config,...}   core (Web APIs only)
  src/infra/            drivers (Postgres; vendored D1 dialect)
  src/runtime/node/     Node entry; runtime/cloudflare/ is a placeholder
  db/migrations, db/sql Kysely migrations and the SQL they execute
  auth.ts               Better Auth CLI entry (schema generation only)
  wrangler.jsonc        Cloudflare placeholder
docs/                   coding.md (working agreement), runbook, Cloudflare checklist
AGENTS.md               conventions for coding agents (CLAUDE.md imports it)
```

## Getting started

Requires Node 24 and a Postgres database.

1. **Create your repo from this template** and rename it — see [Make it yours](#make-it-yours).
2. **Install:** `npm install`
3. **Configure:** copy `.env.example` to `.env` (repo root) and set `DATABASE_URL`,
   `BETTER_AUTH_SECRET` (`npx auth secret`) and the three `OIDC_*` values.
4. **Register the redirect URI** `http://localhost:5173/api/auth/callback/oidc` with your OIDC
   client (`BETTER_AUTH_URL` stays `http://localhost:5173` in development — the Vite dev
   server proxies `/api` to the backend).
5. **Create the schema:** `npm run db:migrate`
6. **Run:** `npm run dev` — web on http://localhost:5173, API on http://localhost:3000.

## Scripts (repo root)

| Script | What it does |
|---|---|
| `npm run dev` | API (`[api]`, :3000) and web (`[web]`, :5173) together |
| `npm run dev:api` / `dev:web` | One of them |
| `npm run build` | Type-check and build both workspaces |
| `npm run start` | Run the built API (set `STATIC_ROOT` to also serve the SPA) |
| `npm run lint` | Oxlint over the whole repo |
| `npm test` | Vitest, both workspaces |
| `npm run db:migrate` | Apply pending Kysely migrations |

Changing the Better Auth schema (adding a plugin, a user field, …) has its own procedure:
[`docs/backend/runbook.md`](docs/backend/runbook.md).

## Make it yours

- `package.json` `name` (root) and `backend/wrangler.jsonc` `name`
- `frontend/src/app/brand.ts` (name, tagline, logo, optional `accountUrl`), `frontend/index.html` `<title>`,
  `frontend/public/` icons
- `frontend/src/app/nav.ts` — sidebar and user-menu entries
- `.env` — your database and OIDC client
- `AGENTS.md` / `docs/` — your project's own conventions and durable docs (`docs/coding.md` §6)

## Deployment

### Docker (primary)

```bash
docker build -t app .
```

```bash
docker run --env-file .env -p 3000:3000 app
```

One image serves the API and the built SPA, runs as the `node` user and has a `/api/health`
health check. Run `npm run db:migrate` against the target database from your deploy pipeline
before starting a new version; the image never migrates.

### Cloudflare Workers (optional)

Not implemented yet: `backend/wrangler.jsonc` and `backend/src/runtime/cloudflare/` are
placeholders, and a vendored Kysely D1 dialect is kept in `backend/src/infra/d1/`. The checklist
(Hyperdrive or D1, Workers Static Assets for the SPA, secrets, migrations) is in
[`docs/deploy/cloudflare.md`](docs/deploy/cloudflare.md).

## License

[MPL-2.0](LICENSE)
