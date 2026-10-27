import "server-only";

import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import { prisma } from "./prisma";

const scrypt = promisify(scryptCallback);

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  intent: z.enum(["login", "register"]),
  name: z.string().trim().min(2).max(80).optional(),
});

type LocalAccount = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  passwordHash: string;
};

type LocalAccountStore = Map<string, LocalAccount>;

const globalStore = globalThis as typeof globalThis & { perxiaLocalAccounts?: LocalAccountStore };

function store() {
  if (!globalStore.perxiaLocalAccounts) globalStore.perxiaLocalAccounts = new Map();
  return globalStore.perxiaLocalAccounts;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function localAccountExists(input: unknown) {
  const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase()).safeParse(input);
  if (!email.success) return false;
  if (process.env.DATABASE_URL) {
    try { return Boolean(await prisma.localAccount.findUnique({ where: { email: email.data }, select: { id: true } })); }
    catch { return false; }
  }
  return Boolean(store().get(email.data));
}

export async function authorizeLocalAccount(input: unknown) {
  if (process.env.AUTH_MODE !== "local") return null;
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return null;
  const { email, password, intent, name } = parsed.data;

  if (process.env.DATABASE_URL) {
    try {
      const account = await prisma.localAccount.findUnique({ where: { email } });
      if (intent === "register") {
        if (account || !name) return null;
        const id = randomUUID();
        const created = await prisma.localAccount.create({ data: { id, tenantId: `local-${id}`, name, email, passwordHash: await hashPassword(password) } }).catch(() => null);
        if (!created) return null;
        return { id: created.id, name: created.name, email: created.email, tenantId: created.tenantId, accountId: created.id };
      }
      if (!account || !(await verifyPassword(password, account.passwordHash))) return null;
      return { id: account.id, name: account.name, email: account.email, tenantId: account.tenantId, accountId: account.id };
    } catch {
      return null;
    }
  }

  if (process.env.NODE_ENV === "production" && process.env.PERXIA_DEMO_MODE !== "true") return null;
  const accounts = store();
  let account = accounts.get(email);
  if (intent === "register") {
    if (account || !name) return null;
    const id = randomUUID();
    account = { id, tenantId: `local-${id}`, name, email, passwordHash: await hashPassword(password) };
    accounts.set(email, account);
  } else if (!account || !(await verifyPassword(password, account.passwordHash))) {
    return null;
  }
  return { id: account.id, name: account.name, email: account.email, tenantId: account.tenantId, accountId: account.id };
}
