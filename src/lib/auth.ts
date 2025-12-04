import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import { loginSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        hcsCode: { label: "HCS Code", type: "text" },
      },
      async authorize(credentials) {
        console.log("[auth] Tenant authorize called");

        if (!credentials) {
          console.log("[auth] No credentials provided");
          return null;
        }

        // Validate input
        const parsed = loginSchema.safeParse({
          email: credentials.email,
          password: credentials.password,
          hcsCode: credentials.hcsCode,
        });

        if (!parsed.success) {
          console.log("[auth] Validation failed:", parsed.error.issues);
          return null;
        }

        const { email, password, hcsCode } = parsed.data;
        
        try {
          // Find tenant by email (using mapped table name)
          const tenant = await prisma.tenant.findUnique({
            where: { email },
          }) as any;

          if (!tenant) {
            console.log("[auth] Tenant not found:", email);
            return null;
          }

          // Check if account is active
          if (tenant.status === "SUSPENDED" || tenant.status === "CANCELLED" || tenant.status === "CHURNED") {
            console.log("[auth] Tenant account is not active:", tenant.status);
            return null;
          }

          // Verify password
          const validPassword = await bcrypt.compare(password, tenant.passwordHash);
          if (!validPassword) {
            console.log("[auth] Invalid password for tenant:", email);
            return null;
          }

          // Verify HCS-U7 code
          const validHcsCode = await bcrypt.compare(hcsCode, tenant.hcsCodeHash);
          if (!validHcsCode) {
            console.log("[auth] Invalid HCS code for tenant:", email);
            return null;
          }

          console.log("[auth] Tenant login successful:", email);
          return {
            id: tenant.id,
            email: tenant.email,
            name: tenant.fullName || tenant.company || email,
            company: tenant.company,
            plan: tenant.plan,
            mustChangePassword: tenant.mustChangePassword,
          };
        } catch (error) {
          console.error("[auth] Database error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        (token as any).company = (user as any).company;
        (token as any).plan = (user as any).plan;
        (token as any).mustChangePassword = (user as any).mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).company = (token as any).company as string | undefined;
        (session.user as any).plan = (token as any).plan as string | undefined;
        (session.user as any).mustChangePassword = (token as any).mustChangePassword as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
