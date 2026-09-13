# Dynicty Automotive

Production-oriented foundation for a single-dealer website that presents new and used cars. This is not a marketplace or checkout application. Phase 0 establishes the architecture, data model, secure admin access, storage boundary, layouts, and quality gates; feature delivery begins in later phases.

## Stack

- Next.js 16 App Router, React 19, strict TypeScript
- Tailwind CSS 4
- PostgreSQL and Prisma ORM
- Zod validation
- bcrypt password hashing and database-backed opaque sessions
- Vitest

## Prerequisites

- Node.js 20.9 or newer
- pnpm 11
- PostgreSQL 15 or newer

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Generate a random `SESSION_SECRET` with at least 32 characters. Set strong one-time `ADMIN_EMAIL` and `ADMIN_PASSWORD` values only while running the seed; remove them from the runtime environment afterward. Never commit `.env.local`.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start development server |
| `pnpm build` | Create production build |
| `pnpm start` | Run production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run strict TypeScript check |
| `pnpm test` | Run foundation tests |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:migrate` | Create/apply a development migration |
| `pnpm db:migrate:deploy` | Apply committed migrations in production |
| `pnpm db:seed` | Upsert the first admin and default settings |

## Structure

`app/` holds routes and layouts, `components/` reusable UI shells, `features/` feature-facing UI, `server/` server-only authentication/configuration, `services/` external boundaries such as storage, `db/` the centralized Prisma client, `validation/` reusable Zod schemas, `tests/` focused foundation tests, and `docs/` the project specification and technical decisions.

## Documentation

- [Master specification](docs/MASTER_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [Storage](docs/STORAGE.md)
- [Security](docs/SECURITY.md)
- [Delivery phases](docs/PHASES.md)
- [Phase 0 report](docs/PHASE_0_REPORT.md)
