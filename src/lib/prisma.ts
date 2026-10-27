import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & { perxiaPrisma?: PrismaClient };

export const prisma = globalForPrisma.perxiaPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.perxiaPrisma = prisma;
