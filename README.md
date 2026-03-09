# React + Hono template for Cloudflare Worker

A full-stack template built with **React**, **Hono**, and **Vite**, designed to run on **Cloudflare Workers**. A single Worker serves both the React SPA and the Hono API, with email/password authentication (Better Auth + D1) and base UI components (shadcn/ui + Tailwind) out of the box. Use it as a starting point for new projects.

---

## Features

| Feature | Description |
|--------|-------------|
| **Full-stack same-origin** | One Worker serves the React SPA and Hono API; no CORS needed |
| **Authentication** | [Better Auth](https://www.better-auth.com/): email/password with Cloudflare D1 |
| **Database** | D1 (SQLite), integrated with Better Auth via a Kysely adapter |
| **UI** | [shadcn/ui](https://ui.shadcn.com/) (Radix + Tailwind v4), Geist font, Lucide icons |
| **Routing & data** | React Router v7, SWR example for API calls |
| **Build & deploy** | Vite 8 + `@cloudflare/vite-plugin`, one-command deploy with `wrangler deploy` |

---

## Tech stack

- **Frontend**: React 19, Vite 8, React Router 7, Tailwind CSS 4, shadcn/ui, SWR
- **Backend**: Hono 4 (runs on Cloudflare Worker)
- **Auth**: Better Auth (email/password, D1 storage)
- **Database**: Cloudflare D1 (SQLite)
- **Runtime**: Cloudflare Workers (with `nodejs_compat`)

---

## Project structure

```
├── src/
│   ├── api/              # Hono app and API routes
│   │   ├── index.ts      # Main app: auth proxy, /api/me, /api/health, /api/messages
│   │   └── me.ts         # Auth-protected /api/me sub-app
│   ├── app/              # Page components
│   │   ├── index.tsx     # Home
│   │   ├── sign-in.tsx   # Sign in
│   │   ├── sign-up.tsx   # Sign up
│   │   ├── dashboard.tsx # Protected dashboard
│   │   ├── messages.tsx  # Example page calling /api/messages
│   │   └── notfound.tsx
│   ├── components/ui/    # shadcn components (button, card, etc.)
│   └── lib/
│       ├── auth.ts       # Better Auth server config (D1)
│       ├── auth-client.ts# Frontend auth client
│       └── data/         # Kysely D1 adapter, etc.
├── migrations/           # Optional: custom D1 migrations
├── better-auth.config.ts # CLI-only: generate Better Auth schema (local SQLite)
├── wrangler.jsonc        # Worker, D1, and static assets config
└── vite.config.ts       # Vite + Cloudflare plugin
```

---

## Prerequisites

- **Node.js** 18+
- **npm** or **pnpm**
- **Cloudflare account** (for D1 and deployment)

---

## Quick start

### 1. Clone and install

```bash
git clone <your-repo-url> my-app
cd my-app
npm install
```

### 2. Environment variables

Create `.dev.vars` in the project root (for local development; it is in `.gitignore`):

```ini
BETTER_AUTH_SECRET=your-32-plus-character-random-string
BETTER_AUTH_URL=http://localhost:5173
```

Example: generate a secret with

```bash
openssl rand -base64 32
```

> For production, set the same variable names as **Secrets** for your Worker in the Cloudflare dashboard, and set `BETTER_AUTH_URL` to your production URL (e.g. `https://your-app.example.com`).

### 3. Initialize Better Auth database tables

#### Manual Apply

Better Auth’s CLI generates schema SQL from the config (using a local SQLite DB). Apply that SQL to D1 manually.

**Generate schema:**

```bash
npm run auth:generate
```

This writes `schema.sql` in the project root by default (use `--output <path>` to change it).

**Apply to D1:**

```bash
# Local D1 (development)
npx wrangler d1 execute cf-react-hono-template --local --file=./schema.sql

# Remote D1 (production)
npx wrangler d1 execute cf-react-hono-template --remote --file=./schema.sql
```

Replace `cf-react-hono-template` with your `database_name` from `wrangler.jsonc` if different.

#### Use `wrangler d1 migration apply`

You may also create  D1 migrations by using `wrangler` CLI, then just copy and paste the generated `schema.sql` into the `wrangler` created migration sql file. 

### 4. Start the dev server

```bash
npm run dev
```

Open **http://localhost:8787** (or the URL shown in the terminal). You can use:

- **/** — Home
- **/sign-up** — Sign up
- **/sign-in** — Sign in
- **/dashboard** — Protected dashboard (requires sign-in)
- **/messages** — Example page that calls `/api/messages`

---

## Architecture

- **Single Worker, two roles**: In `wrangler.jsonc`, `main` points to the Hono entry (`./src/api/index.ts`), and `assets` points to `./dist/client` with `not_found_handling: "single-page-application"`. Unmatched paths (e.g. SPA routes) fall back to `index.html`; `/api/*` is handled by the Worker.
- **Same-origin**: Frontend and API share the same origin, so requests with `credentials: "include"` send cookies; no CORS setup is required.
- **Auth and D1**: At runtime, auth uses D1 via `getAuth(c.env)`. The CLI uses `better-auth.config.ts` with a local SQLite DB only to generate the same schema; you then apply it to D1 with `wrangler d1 execute`.

---

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Local development (Vite + Worker simulation) |
| `npm run build` | Type-check and build (output in `dist/`) |
| `npm run preview` | Preview the production build |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run auth:generate` | Generate Better Auth schema SQL |
| `npm run cf-typegen` | Generate Worker types (`wrangler types`) |
| `npm run check` | Type-check, build, and deploy dry-run |
| `npm run lint` | Run ESLint |

---

## Deploying to Cloudflare

1. Log in: `npx wrangler login`
2. If you haven’t created the D1 database yet, run the remote `wrangler d1 execute ... --remote` command once, or create it in the dashboard and set `database_id` in `wrangler.jsonc`.
3. In the Cloudflare dashboard, set Secrets for the Worker: `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` (your production URL).
4. Run: `npm run deploy`

Assets and the Worker are uploaded together. Use the assigned `*.workers.dev` URL or your custom domain.

---

## API overview

- **GET /api/health** — Health check; returns `{ status: "ok" }`
- **GET /api/messages** — Example JSON list (no auth required)
- **GET /api/me** — Current user when authenticated; returns 401 otherwise
- **POST/GET /api/auth/\*** — Handled by Better Auth (sign-in, sign-up, sign-out, etc.)

---

## Extending the template

- **ESLint**: For type-aware rules, enable e.g. `tseslint.configs.recommendedTypeChecked` in `eslint.config.js` and set `parserOptions.project` to `tsconfig.node.json` / `tsconfig.app.json`.
- **More auth methods**: In `src/lib/auth.ts`, extend `getBetterAuthOptions` with Better Auth plugins (OAuth, magic link, etc.).
- **App migrations**: Add SQL files under `migrations/` and apply them with `wrangler d1 migration apply <YOUR D1 NAME>`.

---

## License

This project is licensed under the **Mozilla Public License 2.0** (MPL 2.0). See [LICENSE](LICENSE) for the full text.

---

## Contributing

Contributions are welcome. To contribute:

1. **Fork** the repository and clone your fork.
2. **Create a branch** for your change: `git checkout -b feature/your-feature` or `fix/your-fix`.
3. **Make your changes**: follow existing code style, keep the template minimal and well-documented.
4. **Test**: run `npm run build` and `npm run lint`; manually test auth and key flows if you changed them.
5. **Commit** with clear messages (e.g. “Add OAuth example”, “Fix D1 binding in dev”).
6. **Push** to your fork and open a **Pull Request** against the default branch. Describe what you changed and why.
7. **Discussion**: maintainers may ask for adjustments; once approved, your PR can be merged.

By contributing, you agree that your contributions will be licensed under the same MPL 2.0 license as this project.

---

## References

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Hono](https://hono.dev/)
- [Better Auth](https://www.better-auth.com/)
- [Vite](https://vite.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
