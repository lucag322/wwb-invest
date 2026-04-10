import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl, headers } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      if (pathname.startsWith("/register")) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      const apiKey = headers.get("x-api-key");
      if (apiKey && pathname.startsWith("/api/")) {
        return true;
      }

      const isAuthPage = pathname.startsWith("/login");

      const isPublic =
        pathname.startsWith("/api/mcp") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/icons") ||
        pathname === "/manifest.json" ||
        pathname === "/sw.js" ||
        pathname === "/favicon.ico" ||
        pathname === "/favicon.png" ||
        pathname === "/logo.png";

      if (isPublic) return true;

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
