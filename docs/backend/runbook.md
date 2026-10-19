# Backend runbook

How to operate the backend's database schema: running migrations and changing the
Better Auth schema. Commands assume the project `.env` at the repository root
(`DATABASE_URL`, `BETTER_AUTH_*`); both CLIs below load it themselves, and variables
already set in the environment (CI, shell) take precedence over the file.

## Migrations

There is a **single migration timeline**: `backend/db/migrations/`, managed by
[kysely-ctl](https://github.com/kysely-org/kysely-ctl) (config:
`backend/.config/kysely.config.ts`). Applied migrations are recorded only in the
`kysely_migration` table.

| Task | Command |
|---|---|
| Apply all pending migrations | `npm run db:migrate` (repo root) |
| List applied / pending | `npx kysely migrate:list` (in `backend/`) |
| Create a migration | `npx kysely migrate:make <name>` (in `backend/`) |
| Roll back the last one (dev only) | `npx kysely migrate:down` (in `backend/`) |

- Development: `DATABASE_URL` points at the local dev database.
- Production: the CI deploy script runs the migrations against the production
  database before the new app version starts. The app process and the runtime image
  never run migrations.
- A migration that has run in any environment is frozen. To change the schema again,
  add a new migration.

## Better Auth schema changes

Better Auth owns the shape of its tables (`user`, `session`, `account`, `verification`,
`apikey`, plus plugin columns), but it **never changes the database itself**: its
`auth generate` command only produces the SQL difference between what the current
configuration needs and what the database already has. That SQL is applied through a
normal Kysely migration, so auth and business tables share one timeline.

Never run `auth migrate` (it would bypass the Kysely timeline) or `auth init` (it
scaffolds a module-scope singleton that does not fit this codebase).

### Inputs

- `backend/src/auth/options.ts` — `createAuthOptions()`, the single source of Better
  Auth options. The runtime and the CLI both use it, so the CLI sees exactly the
  production plugin set.
- `backend/auth.ts` — CLI-only entry the Better Auth CLI discovers automatically. It
  builds an instance from `createAuthOptions()` against `DATABASE_URL`. Application
  code never imports it.

### Procedure

Run steps 2–5 in `backend/`.

1. Change `createAuthOptions()` (e.g. add a plugin or a user field).
2. Make sure the dev database is at the latest migration:
   `npx kysely migrate:latest`.
3. Create the migration that will carry the change:
   `npx kysely migrate:make auth_<what>` → `db/migrations/<prefix>_auth_<what>.ts`.
4. Generate the SQL difference **into a file named after that migration**:

   ```bash
   npx auth generate --output db/sql/<prefix>_auth_<what>.sql --yes
   ```

   If the CLI answers "Your schema is already up to date", the change needs no schema
   migration — delete the migration from step 3.
5. Make the migration execute that file verbatim (do not copy SQL by hand), following
   `db/migrations/*_auth_baseline.ts`:

   ```ts
   import { readFile } from 'node:fs/promises'
   import { type Kysely, sql } from 'kysely'

   const generatedSql = new URL('../sql/<prefix>_auth_<what>.sql', import.meta.url)

   export async function up(db: Kysely<any>): Promise<void> {
   	await sql.raw(await readFile(generatedSql, 'utf8')).execute(db)
   }
   ```

   `down` is optional and hand-written (the generated SQL has no rollback).
6. Apply and confirm: `npm run db:migrate`, then run `npx auth generate` again — it
   must report **"Your schema is already up to date."**

### Why the SQL lives in `db/sql/`

kysely-ctl warns about every non-TypeScript file inside the migrations folder, so the
generated SQL sits next to it in `backend/db/sql/`, one file per migration with the
same name. Like the migration itself, a `.sql` file is frozen once its migration has
run anywhere.
