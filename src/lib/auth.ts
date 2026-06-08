import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations";
import type { Role } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      image?: string | null;
    };
  }
  interface User {
    role: Role;
  }
}

// next-auth/jwt subpath types unavailable in this beta — use casting in callbacks

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  // No adapter — Credentials provider requires JWT strategy.
  // Sessions are tracked in the Session table manually for revocation.
  session: {
    strategy: "jwt",
    maxAge:    30 * 24 * 60 * 60,  // 30-day absolute max
    updateAge: 24 * 60 * 60,       // renew session row every 24 h if active
  },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      const t = token as typeof token & { id: string; role: Role; sessionId?: string };
      if (user?.id) {
        // First sign-in: write id + role into token and create a Session row.
        t.id   = user.id;
        t.role = user.role;

        try {
          const sessionToken = crypto.randomUUID();
          await prisma.session.create({
            data: {
              sessionToken,
              userId:  user.id,
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
          t.sessionId = sessionToken;
        } catch (err) {
          console.error("[auth] Failed to create Session row:", err);
        }
      }
      return t;
    },

    async session({ session, token }) {
      const t = token as typeof token & { id: string; role: Role; sessionId?: string };
      // Validate the Session row still exists — enables instant revocation.
      if (t.sessionId) {
        try {
          const dbSession = await prisma.session.findUnique({
            where: { sessionToken: t.sessionId },
            select: { expires: true },
          });
          if (!dbSession || dbSession.expires < new Date()) {
            // Row deleted or expired: treat as unauthenticated.
            return null as unknown as typeof session;
          }
        } catch (err) {
          console.error("[auth] Session DB check failed:", err);
        }
      }
      session.user.id   = t.id;
      session.user.role = t.role;
      return session;
    },
  },

  events: {
    // Delete the Session row when the user signs out.
    async signOut(message: unknown) {
      const token = (message as { token?: { sessionId?: string } }).token;
      if (token?.sessionId) {
        await prisma.session.deleteMany({
          where: { sessionToken: token.sessionId },
        }).catch(() => {});
      }
    },
  },

  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role as Role,
          image: user.avatar,
        };
      },
    }),
  ],
});
