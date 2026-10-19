import { existsSync } from 'node:fs'
import { PostgresDialect } from 'kysely'
import { defineConfig } from 'kysely-ctl'
import pg from 'pg'
import { parseEnv } from '../src/config/env.js'

// The project .env lives at the repo root. Variables already set (CI, shell) win over the file.
const rootEnv = new URL('../../.env', import.meta.url)
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv)

const env = parseEnv(process.env)

export default defineConfig({
	dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: env.DATABASE_URL }) }),
	// Resolved relative to this .config/ folder.
	migrations: {
		migrationFolder: '../db/migrations',
	},
})
