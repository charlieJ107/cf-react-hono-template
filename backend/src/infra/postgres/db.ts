import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";

export function createPostgresDb<DB>(connectionString: string): Kysely<DB> {
  return new Kysely<DB>({ dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString }) }) });
}
