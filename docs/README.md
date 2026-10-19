# Documentation

This is the docs tree of a project created from **cf-react-hono-template**: an npm-workspaces
monorepo with a React SPA (`frontend/`) and a Hono API (`backend/`), Postgres via Kysely, and
Better Auth signing in through an OIDC provider. The primary deployment target is Node + Docker
+ Postgres; Cloudflare Workers is an optional secondary target.

## How these docs work

This tree follows the spec-driven development agreement in [`coding.md`](coding.md)
(copied verbatim across projects; never edited per project). Read it first.

Standing conventions for agents — commands, architecture boundaries, the migration rules, the
dev-server etiquette — live in the repository's [`AGENTS.md`](../AGENTS.md).

## Layout

```text
docs/
  coding.md            # the SDD working agreement (verbatim)
  README.md            # this index
  backend/
    runbook.md         # database migrations and Better Auth schema changes
  deploy/
    cloudflare.md      # optional Cloudflare Workers target: status and checklist
```

A project made from this template authors its own root durable layer (`requirements.md`,
`design.md`, `philosophy.md`, `blueprint.md`, `goal.md`) together with its owner, per
`coding.md` §6 (Greenfield tier). There is no `timeline/` until the first episode is archived.

## Language

Docs are English by default (`coding.md` §10).
