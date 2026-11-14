import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  appName: "Chessora",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const base = user.name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "player";
          const suffix = user.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toLowerCase();
          await prisma.playerProfile.create({
            data: { userId: user.id, username: `${base}${suffix}` },
          });
        },
      },
    },
  },
});
