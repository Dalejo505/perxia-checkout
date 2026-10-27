import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { authorizeLocalAccount } from "@/lib/local-accounts";

const local = process.env.NODE_ENV !== "production" && process.env.AUTH_MODE === "local";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: process.env.NODE_ENV !== "production",
  session: { strategy: "jwt" },
  providers: local ? [Credentials({
    id: "local",
    name: "Local development",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      name: { label: "Name", type: "text" },
      intent: { label: "Intent", type: "text" },
    },
    authorize: authorizeLocalAccount,
  })] : [MicrosoftEntraID({
    clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
    clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
    issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    profile(profile) {
      return { id: profile.oid ?? profile.sub, name: profile.name, email: profile.email ?? profile.preferred_username, tenantId: profile.tid, accountId: profile.oid ?? profile.sub };
    },
  })],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.tenantId = account?.provider === "local" ? `local-${user.id}` : (profile?.tid as string | undefined);
        token.accountId = account?.provider === "local" ? user.id : (profile?.oid as string | undefined);
      }
      return token;
    },
    async session({ session, token }) {
      session.tenantId = token.tenantId as string | undefined;
      session.accountId = token.accountId as string | undefined;
      return session;
    },
  },
});
