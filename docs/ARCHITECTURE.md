# Architecture

## Shape

The project is one full-stack Next.js App Router application. Route groups separate the public shell from protected admin routes without changing URLs. React Server Components are the default. Client Components are limited to interactive boundaries such as the login form and error recovery.

## Responsibilities

- `app/`: routing, metadata, loading/error boundaries, and route composition.
- `components/`: small reusable public, admin, and UI components.
- `features/`: feature-facing interactive UI.
- `server/`: server-only configuration and authentication code.
- `services/`: infrastructure boundaries, currently object storage.
- `db/client.ts`: the only Prisma client construction point.
- `validation/`: reusable schemas independent of UI.
- `prisma/`: database model, committed migrations, and seed.
- `tests/`: high-value foundation behavior.

## Request boundaries

Public routes do not require database access in Phase 0. The `/admin/login` page accepts credentials through a Server Action. Protected admin layouts call `requireAdmin()` server-side before rendering. Every future mutation must repeat authorization and input validation inside its Server Action; hiding a button is not an authorization boundary.

Business rules should live in feature/server services, not JSX. Infrastructure providers must be reached through interfaces so later R2 adoption does not rewrite car-domain behavior.

## Phase 1 write flow

Client forms invoke dedicated `use server` action modules. Each action re-authorizes the admin and validates untrusted `FormData` before calling `server/cars/service.ts`. The service owns brand/model consistency, Decimal conversion, unique-slug allocation, transactions for cover/order changes, and storage compensation. Pure price, slug, relationship, image-order, and upload rules remain independently testable.
