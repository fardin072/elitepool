# Authentication & Session — ElitePool

A complete walkthrough of how authentication and session management are implemented in this project.

---

## Stack

| Concern | Library / Tool |
|---|---|
| Auth framework | **NextAuth.js v5 beta** (`next-auth`) |
| Provider | **Credentials** (email + password) |
| Password hashing | **bcryptjs** (cost factor 12) |
| Session strategy | **Database sessions** via `@auth/prisma-adapter` |
| Session storage | `Session` table in PostgreSQL (indexed by `sessionToken`) |
| Input validation | **Zod v4** |
| Database | **Prisma v6** → PostgreSQL |
| Route protection | Custom **proxy.ts** (Next.js 16 middleware convention) |

---

## File Map

```
src/
├── lib/
│   └── auth.ts                         # NextAuth config, adapter, callbacks, module augmentation
├── proxy.ts                            # Route-level guard (replaces middleware.ts in Next.js 16)
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts  # NextAuth catch-all handler (GET + POST)
│   │       └── register/route.ts      # Sign-up endpoint
│   └── (auth)/
│       └── login/
│           ├── page.tsx                # Server page — wraps LoginForm in <Suspense>
│           └── login-form.tsx          # Client form — calls signIn("credentials")
├── components/
│   └── providers.tsx                   # <SessionProvider> wrapping the whole app
└── lib/
    └── validations/index.ts            # loginSchema + signupSchema (Zod)

prisma/
└── schema.prisma                       # User, Session, Account, VerificationToken models
```

---

## 1. NextAuth Configuration — `src/lib/auth.ts`

This is the central config file. `NextAuth()` returns four named exports used throughout the app.

```ts
export const { handlers, auth, signIn, signOut } = NextAuth({ ... });
```

| Export | Used by |
|---|---|
| `handlers` | `app/api/auth/[...nextauth]/route.ts` — exposes the HTTP endpoints |
| `auth` | API route handlers — server-side session read (`const session = await auth()`) |
| `signIn` | Not used directly server-side; the client calls `next-auth/react`'s `signIn` |
| `signOut` | TopNav dropdown — `signOut({ callbackUrl: "/login" })` |

### Session Strategy

```ts
adapter: PrismaAdapter(prisma),
session: {
  strategy: "database",
  maxAge:    30 * 24 * 60 * 60,  // 30-day absolute maximum lifetime
  updateAge: 24 * 60 * 60,       // renew the session row every 24 h of activity
},
```

Sessions are stored in the `Session` table in PostgreSQL. The browser holds only a short opaque token (the `sessionToken` cookie). On every authenticated request, NextAuth looks up that token in the DB — if no matching row exists or the row has expired, the request is treated as unauthenticated.

**Why database sessions over JWT:**

| Concern | JWT (previous) | Database sessions (current) |
|---|---|---|
| Revoke on logout | No — cookie cleared locally, token still valid | Yes — row deleted instantly |
| Revoke on password change | No | Yes — delete all rows for the user |
| Account compromise response | Wait for expiry | Delete the row in milliseconds |
| `NEXTAUTH_SECRET` rotation | Logs everyone out | Safe — secret only used for CSRF |
| Session overhead | JWT decode (CPU only) | One indexed `SELECT` per request (~1–5 ms) |

### Adapter

```ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

adapter: PrismaAdapter(prisma),
```

`@auth/prisma-adapter` was already listed as a dependency but was previously inactive. It is now wired in. The adapter handles all session and account persistence automatically — creating a `Session` row on sign-in, deleting it on sign-out, and updating `expires` on each `updateAge` window.

### Module Augmentation

NextAuth's built-in `Session.user` type only has `name`, `email`, and `image`. The project extends it to carry `id` and `role`:

```ts
declare module "next-auth" {
  interface Session {
    user: { id: string; name: string; email: string; role: Role; image?: string | null };
  }
  interface User {
    role: Role;
  }
}
```

### Callbacks

With database sessions only the `session()` callback is needed. The `jwt()` callback is not called and has been removed.

```
authorize() → User object
    ↓
NextAuth creates a Session row in the DB (via adapter)
    ↓
session() callback — receives `user` (fresh DB row) on every session read
    ↓
session.user.id + session.user.role attached and available everywhere
```

```ts
async session({ session, user }) {
  session.user.id   = user.id;
  session.user.role = (user as unknown as { role: Role }).role;
  return session;
},
```

The `user` argument is the live `User` record from PostgreSQL (joined by the adapter), so `role` is always current — no stale data from a token payload.

### Credentials Provider

The `authorize` function is the authentication gate:

1. **Validate input** with `loginSchema.safeParse()` — rejects malformed payloads before touching the DB.
2. **Look up the user** by email via `prisma.user.findUnique`.
3. **Compare the password** with `bcrypt.compare(password, user.passwordHash)`.
4. Return the user object on success, `null` on any failure (NextAuth converts `null` into a `CredentialsSignin` error).

```ts
async authorize(credentials) {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return null;

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role, image: user.avatar };
},
```

### Custom Pages

```ts
pages: { signIn: "/login", error: "/login" }
```

NextAuth redirects unauthenticated users and auth errors to `/login` instead of its default `/api/auth/signin`.

---

## 2. Prisma Schema — Session Models

Three models were added to `prisma/schema.prisma` (migration `20260602070315_add_session_tables`). The `User` model gained two new relations.

```prisma
model User {
  // ...existing fields...
  accounts Account[]
  sessions Session[]
}

model Session {
  sessionToken String   @unique   // the value stored in the browser cookie
  userId       String
  expires      DateTime           // row is considered invalid after this timestamp
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  // Required by @auth/prisma-adapter even with Credentials-only auth.
  // Populated automatically if OAuth providers are added in the future.
  userId            String
  type              String
  provider          String
  providerAccountId String
  // ...OAuth token fields...
  user              User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([provider, providerAccountId])
}

model VerificationToken {
  // Required by @auth/prisma-adapter schema contract.
  // Used for email-based magic links / verification if added in future.
  identifier String
  token      String
  expires    DateTime
  @@id([identifier, token])
}
```

`Account` and `VerificationToken` are required by the adapter's schema contract and must exist even though Credentials auth does not use them. They will be populated automatically if OAuth or email providers are added later.

---

## 3. The NextAuth Catch-All Route Handler

`src/app/api/auth/[...nextauth]/route.ts` exposes all NextAuth HTTP endpoints:

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/callback/credentials` | Runs `authorize`, creates `Session` row, sets cookie |
| `GET` | `/api/auth/session` | Returns the current session as JSON (used by `useSession`) |
| `GET` | `/api/auth/csrf` | Returns a CSRF token for form submissions |
| `GET/POST` | `/api/auth/signout` | Deletes the `Session` row and clears the cookie |

---

## 4. Registration — `src/app/api/auth/register/route.ts`

Sign-up is a plain Next.js API route (not part of NextAuth):

1. Parse and validate the request body with `signupSchema`.
2. Check for an existing user with the same email (returns `409 Conflict` if found).
3. Hash the password with `bcrypt.hash(password, 12)` — cost factor 12 (~250 ms per hash).
4. Create the `User` row in Postgres via Prisma.

After registration the client must separately call `signIn("credentials", ...)` to create a session. Registration does not auto-login.

---

## 5. Route Protection — `src/proxy.ts`

Next.js 16 renamed `middleware.ts` to `proxy.ts` and changed the export convention. The file exports `proxy` (function) and `config` (object).

```ts
export async function proxy(req: NextRequest) { ... }
export const config = { matcher: [...] };
```

### How it works

```
Every request (except static assets)
    ↓
proxy() calls auth() — one DB lookup on Session.sessionToken
    ↓
No session + non-public path?  → redirect to /login?callbackUrl=<original path>
Has session + on /login?       → redirect to /
Otherwise                      → NextResponse.next()
```

Previously the proxy used `getToken()` to decode a JWT — a CPU-only operation. It now calls `auth()` which performs a database lookup. The trade-off is ~1–5 ms extra latency on every request in exchange for the ability to revoke sessions instantly.

### Public paths

```ts
const PUBLIC_PATHS = ["/login", "/signup", "/api/auth"];
```

Any path starting with one of these is allowed through without a session.

### `callbackUrl`

When a logged-out user tries to access `/projects/abc`, the proxy redirects to `/login?callbackUrl=/projects/abc`. After a successful sign-in, `LoginForm` pushes the user back:

```ts
const callbackUrl = searchParams.get("callbackUrl") ?? "/";
router.push(callbackUrl);
```

---

## 6. Client-Side Session — `SessionProvider` + `useSession`

`src/components/providers.tsx` wraps the entire app in `<SessionProvider>`:

```tsx
<SessionProvider>
  <QueryClientProvider ...>
    ...
  </QueryClientProvider>
</SessionProvider>
```

`SessionProvider` polls `/api/auth/session` and makes the result available via `useSession()` in any client component:

```ts
const { data: session } = useSession();
// session.user.id   → string
// session.user.name → string
// session.user.role → "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER"
```

### Server-side session reads (API routes)

Every protected API route calls `auth()`:

```ts
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // session.user.id / session.user.role available here
}
```

`auth()` validates the session cookie against the `Session` table. The call is identical whether using JWT or database sessions — no API route needed to change when the strategy was switched.

---

## 7. Login Flow — `LoginForm`

The login form is a **Client Component** because it needs `useSearchParams()` (which requires a Suspense boundary in the parent `page.tsx`):

```tsx
export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
```

On submit, it calls NextAuth's client-side `signIn` with `redirect: false`:

```ts
const res = await signIn("credentials", { email, password, redirect: false });
if (res?.error) {
  setError("Invalid email or password.");
  return;
}
router.push(callbackUrl);
router.refresh();
```

`router.refresh()` forces server components to re-render with the new session after sign-in.

---

## 8. Roles (RBAC)

Three roles are defined in `src/types/index.ts`:

```ts
type Role = "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";
```

The role is stored on the `User` Prisma model and flows through `authorize` → `session()` callback → `session.user.role`. Because the `session()` callback reads the live `User` row on every session validation, a role change in the database is reflected on the user's next request without requiring re-login.

Role-based UI (badge colours, labels, menu visibility) is enforced on the client. API-level enforcement is done per-route by checking `session.user.role` or scoping Prisma queries to data the user owns or is a member of.

---

## 9. Session Lifecycle & Maintenance

| Event | What happens |
|---|---|
| Sign in | `Session` row created with `expires = now + 30 days` |
| Active use (within 24 h window) | `Session.expires` extended by 30 days, `updatedAt` refreshed |
| Sign out | `Session` row deleted — token is immediately invalid everywhere |
| Password change | Call `prisma.session.deleteMany({ where: { userId } })` to revoke all sessions |
| Row expires naturally | Row stays in DB but `auth()` treats it as unauthenticated |

**Expired session cleanup:** PostgreSQL does not auto-delete expired rows. To prevent table bloat, extend the existing `/api/cron/overdue` cron job to also run:

```ts
await prisma.session.deleteMany({ where: { expires: { lt: new Date() } } });
```

---

## 10. Environment Variables Required

```env
NEXTAUTH_SECRET=<random 32+ byte string>   # signs CSRF tokens (no longer signs session tokens)
NEXTAUTH_URL=http://localhost:3000          # base URL (needed in some environments)
DATABASE_URL=<postgres connection string>
DIRECT_URL=<direct postgres connection>    # used by Prisma migrations
```

`NEXTAUTH_SECRET` is now used only for CSRF token signing. Rotating it does **not** invalidate existing database sessions — users stay logged in.

---

## Sign-in Sequence Diagram

```
Browser          LoginForm         /api/auth/callback/credentials    DB (Session table)   proxy.ts
   |                 |                          |                           |                  |
   |── POST /login ──►                          |                           |                  |
   |                 |── signIn("credentials") ►|                           |                  |
   |                 |                          |── authorize()             |                  |
   |                 |                          |   ├─ Zod validate         |                  |
   |                 |                          |   ├─ prisma.findUnique    |                  |
   |                 |                          |   └─ bcrypt.compare       |                  |
   |                 |                          |── adapter.createSession() ►                  |
   |                 |                          |   (INSERT Session row)    |                  |
   |                 |                          |── set-cookie: sessionToken ──────────────────►
   |                 |◄── { ok: true } ─────────|                           |                  |
   |                 |── router.push(callbackUrl)|                           |                  |
   |◄── redirect ────|                          |                           |                  |
   |── GET /dashboard ──────────────────────────────────────────────────────────────────────►  |
   |                                                                         |              auth()
   |                                                                         |◄─ SELECT Session
   |                                                                         |   WHERE sessionToken
   |                                                                         |   → valid row found
   |◄── 200 ──────────────────────────────────────────────────────────────────────────────────|
```
