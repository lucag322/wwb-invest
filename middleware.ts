import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.png|icons|manifest.json|sw.js).*)",
  ],
};
