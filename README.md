# fwsTasks — Smart Project & Task Collaboration

A full-stack, role-based project and task management platform built with Next.js 16, Prisma, and NextAuth. Designed for teams that need structured project tracking, real-time activity feeds, and analytics — without the complexity of enterprise tooling.

---

## Features

- **Role-based access control** — Admin, Project Manager, and Team Member roles with enforced permissions
- **Project management** — Create, edit, and track projects with status (Active / On Hold / Completed) and deadline tracking
- **Task management** — Assign tasks with priority (High / Medium / Low), status workflows, due dates, and per-project filtering
- **Analytics dashboard** — Charts for task distribution by priority, status, and project progress
- **Activity log** — Workspace-wide audit trail of every create / update / delete action
- **Member directory** — Workload overview per member with completion rates and overdue counts
- **Dark / light mode** — Persisted theme toggle
- **Responsive layout** — Full mobile and tablet support with a slide-in drawer sidebar
- **Command palette** — Keyboard-driven navigation (`⌘K`)
- **Notification centre** — In-app notification bell

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, TypeScript strict) |
| Styling | Tailwind CSS v4 + shadcn/ui (base-nova / Base UI) |
| Auth | NextAuth.js v5 beta — Credentials provider, JWT sessions |
| Database | PostgreSQL via Prisma v6 ORM |
| State | TanStack Query v5 (server state) + Zustand v5 (UI state) |
| Charts | Recharts v3 |
| Validation | Zod v4 + React Hook Form v7 |
| Email / Storage | AWS SES v2 + AWS S3 (SDK v3) |
| Runtime | Node.js 20 |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10 (`npm i -g pnpm`)
- PostgreSQL database (local or hosted — [Neon](https://neon.tech) recommended)

### 1. Clone and install

```bash
git clone https://github.com/fardin072/elitepool.git
cd elitepool/elitepool
pnpm install
```

### 2. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Prisma connection string (pooled) |
| `DIRECT_URL` | Direct connection string (for migrations) |
| `AUTH_SECRET` | Random 32-char secret — generate with `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | Set to `true` in production |
| `NEXTAUTH_URL` | Full origin URL, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Same as above (exposed to client) |
| `NODE_ENV` | `development` or `production` |

**Optional (AWS integrations):**

| Variable | Description |
|---|---|
| `AWS_REGION` | AWS region for SES and S3 |
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret |
| `S3_BUCKET_NAME` | Bucket for file attachments |
| `SES_FROM_EMAIL` | Verified sender address |

### 3. Set up the database

```bash
# Push schema (creates tables without migration history — good for first run)
pnpm db:push

# Or run migrations (recommended for production)
pnpm db:migrate

# Seed demo data (creates 4 users, sample projects and tasks)
pnpm db:seed
```

### 4. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Accounts

All demo accounts use the password **`demo1234`**.

| Role | Email | Permissions |
|---|---|---|
| Admin | `admin@fwstasks.dev` | Full access — manage users, projects, tasks, settings |
| Project Manager | `pm@fwstasks.dev` | Create and manage projects, assign tasks |
| Team Member | `dev1@fwstasks.dev` | View assigned tasks, update task status |
| Team Member | `dev2@fwstasks.dev` | View assigned tasks, update task status |

---

## Project Structure

```
elitepool/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Demo data seed script
├── public/
│   └── logo.png             # App logo
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login and signup pages
│   │   ├── (dashboard)/     # Protected app pages
│   │   │   ├── page.tsx         # Dashboard home
│   │   │   ├── projects/        # Project list + detail
│   │   │   ├── tasks/           # Task management
│   │   │   ├── members/         # Member directory
│   │   │   ├── analytics/       # Charts and metrics
│   │   │   ├── profile/         # User profile
│   │   │   └── settings/        # App settings
│   │   └── api/
│   │       ├── auth/            # NextAuth + registration
│   │       ├── projects/        # Project CRUD
│   │       ├── tasks/           # Task CRUD
│   │       ├── members/         # Member listing
│   │       ├── dashboard/       # Aggregated stats
│   │       ├── activity/        # Activity log
│   │       ├── profile/         # Profile + password update
│   │       └── cron/overdue     # Scheduled overdue check
│   ├── components/
│   │   ├── layout/          # Sidebar, TopNav
│   │   ├── dashboard/       # Dashboard + Analytics clients
│   │   ├── projects/        # Project list, dialog, detail
│   │   ├── tasks/           # Task table, dialog
│   │   ├── members/         # Member cards
│   │   ├── charts/          # Recharts wrappers
│   │   └── ui/              # shadcn/ui primitives
│   ├── lib/
│   │   ├── auth.ts          # NextAuth config
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── utils.ts         # cn, formatDate, isOverdue, etc.
│   │   └── validations/     # Zod schemas
│   ├── store/
│   │   └── useUIStore.ts    # Zustand — sidebar, filters, selections
│   └── types/               # Shared TypeScript types
├── proxy.ts                 # Next.js 16 middleware (auth guard)
└── next.config.ts
```

---

## API Reference

All routes require an authenticated session (enforced by `proxy.ts`) except `POST /api/auth/register` and NextAuth endpoints.

### Projects

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | List projects (`?search=`, `?status=`, `?pageSize=`) |
| `POST` | `/api/projects` | Create project |
| `GET` | `/api/projects/:id` | Get project with tasks |
| `PATCH` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project (cascade tasks) |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | List tasks (`?search=`, `?status=`, `?priority=`, `?projectId=`) |
| `POST` | `/api/tasks` | Create task |
| `PATCH` | `/api/tasks/:id` | Update task (status, assignee, priority, etc.) |
| `DELETE` | `/api/tasks/:id` | Delete task |

### Other

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | KPIs, recent activity, upcoming deadlines, chart data |
| `GET` | `/api/members` | List workspace users (`?search=`) |
| `GET` | `/api/activity` | Paginated activity log |
| `GET/PATCH` | `/api/profile` | Get / update current user profile |
| `POST` | `/api/profile/password` | Change password |
| `POST` | `/api/auth/register` | Create new account |
| `GET` | `/api/cron/overdue` | Cron endpoint — marks overdue tasks (call via cron job) |

---

## Database Schema

```
User ──< ProjectMember >── Project ──< Task
                                       │
                                       ├──< Comment
                                       └──< Attachment

ActivityLog (polymorphic — references User + Project)
```

**Roles:** `ADMIN` · `PROJECT_MANAGER` · `TEAM_MEMBER`  
**Project statuses:** `ACTIVE` · `COMPLETED` · `ON_HOLD`  
**Task statuses:** `TODO` · `IN_PROGRESS` · `COMPLETED`  
**Task priorities:** `LOW` · `MEDIUM` · `HIGH`

---

## Development

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm db:generate  # Regenerate Prisma client after schema changes
pnpm db:migrate   # Create and apply a new migration
pnpm db:studio    # Open Prisma Studio (visual DB browser)
pnpm db:seed      # Re-seed demo data
```

---

## Deployment

The project targets **AWS Lambda + CloudFront** via [SST Ion](https://ion.sst.dev) and OpenNext.

```bash
# Install SST CLI
curl -fsSL https://ion.sst.dev/install | bash

# Deploy to production
npx sst deploy --stage production
```

**Required AWS permissions:** Lambda, CloudFront, S3, SES, IAM (for the deploy user).

For a simpler deployment, the app also works on **Vercel** out of the box:

1. Import the repo on [vercel.com/new](https://vercel.com/new)
2. Set the root directory to `elitepool`
3. Add all environment variables from the table above
4. Deploy

---

## Environment Variable Reference

Create `.env.local` in the `elitepool/` directory (never commit this file):

```env
# Database (PostgreSQL — Neon recommended)
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
DIRECT_URL="postgresql://user:password@host/db?sslmode=require"

# Auth
AUTH_SECRET="your-32-char-secret"
AUTH_TRUST_HOST=true
NEXTAUTH_URL="http://localhost:3000"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

NODE_ENV=development

# AWS (optional — needed for S3 uploads and SES email)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
SES_FROM_EMAIL=
```

---

## Known Constraints

- **NextAuth v5 beta** — uses `proxy.ts` (not `middleware.ts`) as the auth guard. Export `proxy()` and `proxyConfig` instead of `middleware()` and `config`.
- **Prisma v6** — do not upgrade to v7; it moves `url` out of `schema.prisma` into a separate `prisma.config.ts` and requires adapter changes.
- **shadcn base-nova** uses `@base-ui/react` — components do not accept `asChild`. Use the `render` prop for composition.
- **Zod v4** — do not use `.default()` with React Hook Form resolvers; set defaults via `useForm({ defaultValues })` instead.

---

## License

Private — all rights reserved.
