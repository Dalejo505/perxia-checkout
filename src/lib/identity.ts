import "server-only";
import { auth } from "@/auth";
import { DomainError, type Tenant } from "./domain";

export async function identity(): Promise<Tenant> {
  const session = await auth();
  if (!session?.tenantId || !session.accountId) throw new DomainError("UNAUTHORIZED", "Sign in with a valid organization account", 401);
  return { tenantId: session.tenantId, accountId: session.accountId, name: session.user?.name ?? "Workspace" };
}
