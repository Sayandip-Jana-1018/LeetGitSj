import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // Only request identity scopes — never repo.
      // All repo writes go through the separate GitHub App.
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      // Attach user ID to the session for use in API routes
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Persist GitHub user ID on the User model for reference
      if (account?.provider === "github" && profile?.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { githubId: String(profile.id) },
          });
        } catch {
          // User might not exist yet (first sign-in) — adapter handles creation
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});
