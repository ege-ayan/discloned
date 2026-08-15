# Discloned

Real-time Discord-style chat: servers, channels, DMs, roles, and voice/video. Next.js App Router, PostgreSQL, Clerk, Socket.IO, and LiveKit.

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

| Area          | What it does                            |
| ------------- | --------------------------------------- |
| Servers       | Create, edit, invite, leave, delete     |
| Channels      | Text, audio, and video channels         |
| Chat          | Channel messages and DMs over Socket.IO |
| Voice / video | LiveKit rooms                           |
| Members       | Admin, moderator, guest                 |
| Files         | UploadThing attachments                 |
| UI            | Tailwind CSS + shadcn/ui, dark mode     |

## Stack

- **App:** Next.js 16, React 19, TypeScript
- **Data:** PostgreSQL, Prisma 7
- **Auth:** Clerk
- **Realtime:** Socket.IO (messages), LiveKit (A/V)
- **Uploads:** UploadThing
- **Client state:** Zustand, TanStack Query, React Hook Form, Zod 4

## Data model

```mermaid
erDiagram
    Profile ||--o{ Server : owns
    Profile ||--o{ Member : is
    Server ||--o{ Member : has
    Server ||--o{ Channel : has
    Member ||--o{ Message : sends
    Channel ||--o{ Message : contains
    Member ||--o{ Conversation : joins
    Conversation ||--o{ DirectMessage : contains
```

## Setup

**Need:** Node.js 22+, npm, a PostgreSQL database, and accounts for [Clerk](https://clerk.com/), [UploadThing](https://uploadthing.com/), and [LiveKit](https://livekit.io/).

### 1. Install

```bash
git clone https://github.com/ege-ayan/discloned.git
cd discloned
npm install
```

This repo uses **npm** only (`package-lock.json`). Do not add a pnpm or yarn lockfile.

### 2. Environment

Copy [`.env.example`](.env.example) to `.env` and fill in real values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/discloned?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/discloned?sslmode=require"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

UPLOADTHING_TOKEN=

LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=

NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

`DATABASE_URL` is the app pool. `DIRECT_URL` is used by Prisma migrate/push (no pgbouncer). In Clerk, set the sign-in/sign-up paths to `/sign-in` and `/sign-up`.

### 3. Database

```bash
npx prisma db push
```

### 4. Develop

```bash
npm run dev
```

## Scripts

| Script                 | Purpose                              |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Next.js + Turbopack                  |
| `npm test`             | Vitest unit tests                    |
| `npm run test:watch`   | Vitest watch mode                    |
| `npm run typecheck`    | `tsc --noEmit`                       |
| `npm run lint`         | ESLint                               |
| `npm run format`       | Prettier write                       |
| `npm run format:check` | Prettier check                       |
| `npm run ci`           | Lint, format check, typecheck, tests |
| `npm run build`        | Production build                     |
| `npm start`            | Serve the production build           |

`prisma generate` runs on `npm install` (`postinstall`).

## CI and releases

Push to `main` runs Prisma validate, lint, format check, typecheck, tests, and production build.

Tag `v*` (or run the **Release** workflow) publishes a GitHub Release with a source archive and `SHA256SUMS.txt`.

```bash
git tag -a v0.1.0 -m "Discloned 0.1.0"
git push origin v0.1.0
```

## License

MIT — see [LICENSE](LICENSE).
