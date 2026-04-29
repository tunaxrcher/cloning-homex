import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { signInSchema_ } from "./lib/formValidationSchemas";
import { userSignIn } from "./lib/auth-helpers";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: {
          label: "USERNAME",
          type: "text",
          placeholder: "username ผู้ใช้งาน",
        },
        passwordHash: {
          label: "PASSWORD",
          type: "password",
          placeholder: "รหัสผ่าน ผู้ใช้งาน",
        },
      },
      async authorize(credentials) {
        let signInResult = null;

        const parsedCredentials = signInSchema_.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { username, passwordHash } = parsedCredentials.data;

        signInResult = await userSignIn({ username, passwordHash });

        if (!signInResult) return null;
        return signInResult;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    authorized({ request: { nextUrl }, auth }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;
      const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/projects") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/user");

      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username as string;
        token.email = user.email as string;
        token.isActive = user.isActive as boolean;
        token.displayName = user.displayName as string;
        token.phone = user.phone as string;
        token.address = user.address as string;
        token.note = user.note as string;
        token.avatarUrl = (user.avatarUrl || user.image) as string | null;
        token.createdAt = user.createdAt as Date;
        token.organizationId = user.organizationId as number;
        token.positionId = user.positionId as number;
        token.permissions = user.permissions as string[];
        token.positionName = user.positionName as string | null;
      }

      if (trigger === "update" && session) {
        return { ...token, ...session };
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.email = token.email as string;
      session.user.isActive = token.isActive as boolean;
      session.user.displayName = token.displayName as string | null;
      session.user.phone = token.phone as string | null;
      session.user.address = token.address as string | null;
      session.user.note = token.note as string | null;
      session.user.avatarUrl = token.avatarUrl as string | null;
      session.user.createdAt = token.createdAt as Date;
      session.user.organizationId = token.organizationId as number | 0;
      session.user.positionId = token.positionId as number | null;
      session.user.permissions = token.permissions as string[];
      session.user.positionName = token.positionName as string | null;
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});
