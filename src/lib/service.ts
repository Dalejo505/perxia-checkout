import "server-only";
import { cartSchema, computeQuote, DomainError, type Order, type Tenant } from "./domain";
import type { CheckoutRepository } from "./repository";

export async function createQuote(repo: CheckoutRepository, tenant: Tenant, input: unknown) {
  const cart = cartSchema.parse(input);
  const quote = computeQuote(await repo.catalog(), cart, tenant.tenantId);
  await repo.saveQuote(quote);
  return quote;
}

export async function createOrder(repo: CheckoutRepository, tenant: Tenant, quoteId: string): Promise<Order> {
  const quote = await repo.quote(quoteId, tenant.tenantId);
  if (!quote) throw new DomainError("QUOTE_NOT_FOUND", "Quote not found", 404);
  if (new Date(quote.expiresAt).getTime() <= Date.now()) throw new DomainError("QUOTE_EXPIRED", "Create a new quote", 409);
  const now = new Date().toISOString();
  const order: Order = { id: crypto.randomUUID(), tenantId: tenant.tenantId, accountId: tenant.accountId, quote, status: "pending", createdAt: now, updatedAt: now };
  await repo.saveOrder(order);
  return order;
}

export async function requireOrder(repo: CheckoutRepository, tenant: Tenant, id: string) {
  const order = await repo.order(id, tenant.tenantId);
  if (!order) throw new DomainError("ORDER_NOT_FOUND", "Order not found", 404);
  return order;
}
