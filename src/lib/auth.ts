import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import { loginSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { auditLoginSuccess, auditLoginFailed } from "@/lib/audit";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? "__Secure-next-auth.session-token" 
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
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
        console.log("========================================");
        console.log("[auth] Tenant authorize called");
        console.log("[auth] Credentials received:", {
          email: credentials?.email,
          password: credentials?.password ? "***" : undefined,
          hcsCode: credentials?.hcsCode ? credentials.hcsCode.substring(0, 30) + "..." : undefined,
        });

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
        console.log("[auth] Looking for tenant with email:", email);
        
        try {
          // Find tenant by email (using mapped table name)
          const tenant = await prisma.tenant.findUnique({
            where: { email },
          }) as any;

          console.log("[auth] Tenant query result:", tenant ? {
            id: tenant.id,
            email: tenant.email,
            status: tenant.status,
            hasPasswordHash: !!tenant.passwordHash,
            hasHcsCodeHash: !!tenant.hcsCodeHash,
            passwordHashPrefix: tenant.passwordHash ? tenant.passwordHash.substring(0, 10) : "NULL",
            hcsCodeHashPrefix: tenant.hcsCodeHash ? tenant.hcsCodeHash.substring(0, 10) : "NULL",
          } : "NOT FOUND");

          if (!tenant) {
            console.log("[auth] Tenant not found:", email);
            await auditLoginFailed(email, "User not found");
            return null;
          }

          // Check if account is active
          if (tenant.status === "SUSPENDED" || tenant.status === "CANCELLED" || tenant.status === "CHURNED") {
            console.log("[auth] Tenant account is not active:", tenant.status);
            await auditLoginFailed(email, `Account status: ${tenant.status}`);
            return null;
          }

          // Debug: Check if hashes look valid (bcrypt hashes start with $2a$ or $2b$)
          console.log("[auth] Password hash valid format:", tenant.passwordHash?.startsWith("$2"));
          console.log("[auth] HCS code hash valid format:", tenant.hcsCodeHash?.startsWith("$2"));

          // Verify password
          console.log("[auth] Comparing password...");
          const validPassword = await bcrypt.compare(password, tenant.passwordHash);
          console.log("[auth] Password comparison result:", validPassword);
          if (!validPassword) {
            console.log("[auth] Invalid password for tenant:", email);
            await auditLoginFailed(email, "Invalid password");
            return null;
          }

          // Verify HCS-U7 code
          console.log("[auth] Comparing HCS code...");
          console.log("[auth] HCS code input length:", hcsCode.length);
          const validHcsCode = await bcrypt.compare(hcsCode, tenant.hcsCodeHash);
          console.log("[auth] HCS code comparison result:", validHcsCode);
          if (!validHcsCode) {
            console.log("[auth] Invalid HCS code for tenant:", email);
            await auditLoginFailed(email, "Invalid HCS code");
            return null;
          }

          console.log("[auth] Tenant login successful:", email);
          await auditLoginSuccess(tenant.id, email);
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
