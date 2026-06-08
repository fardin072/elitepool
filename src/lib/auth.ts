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

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    sessionId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  basePath: "/api/auth",
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
    async jwt({ token, user, trigger }) {
      // Handle explicit session update (e.g., logout)
      if (trigger === "update") {
        return null as unknown as typeof token;
      }

      if (user?.id) {
        // First sign-in: write id + role into token and create a Session row.
        token.id   = user.id;
        token.role = user.role;

        const sessionToken = crypto.randomUUID();
        await prisma.session.create({
          data: {
            sessionToken,
            userId:  user.id,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        token.sessionId = sessionToken;
      }
      return token;
    },

    async session({ session, token }) {
      // If token is null, session is invalid (logged out)
      if (!token || !token.sessionId) {
        return null as unknown as typeof session;
      }

      // Validate the Session row still exists — enables instant revocation.
      const dbSession = await prisma.session.findUnique({
        where: { sessionToken: token.sessionId },
        select: { expires: true },
      });
      if (!dbSession || dbSession.expires < new Date()) {
        // Row deleted or expired: treat as unauthenticated.
        return null as unknown as typeof session;
      }

      session.user.id   = token.id;
      session.user.role = token.role;
      return session;
    },
  },

  events: {
    // Delete the Session row when the user signs out.
    async signOut(message) {
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
        if (!parsed.success) {
          console.error("[auth] Schema validation failed:", parsed.error.errors);
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          console.error("[auth] User not found:", email);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          console.error("[auth] Password invalid for user:", email);
          return null;
        }

        console.log("[auth] Login successful for:", email);
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
