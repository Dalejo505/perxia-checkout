import { z } from "zod";

export const selectionSchema = z.object({
  priceId: z.string().min(1),
  quantity: z.number().int().min(1).max(100),
});

export const cartSchema = z.object({
  workers: z.array(selectionSchema).min(1).max(20),
  credits: z.array(selectionSchema).max(10).default([]),
}).refine((cart) => cart.workers.reduce((sum, item) => sum + item.quantity, 0) <= 100, { message: "Maximum 100 workers" });

export type Cart = z.infer<typeof cartSchema>;
export type Cadence = "week" | "month";
export type Price = { id: string; version: number; amount: number; currency: "usd"; cadence: Cadence | "once"; active: boolean };
export type Product = { id: string; kind: "worker" | "credit"; name: Record<"es" | "en" | "pt-BR", string>; description: Record<"es" | "en" | "pt-BR", string>; prices: Price[] };
export type QuoteLine = { productId: string; productName: string; kind: Product["kind"]; priceId: string; priceVersion: number; cadence: Price["cadence"]; unitAmount: number; quantity: number; amount: number };
export type Quote = { id: string; tenantId: string; currency: "usd"; lines: QuoteLine[]; dueNow: number; weekly: number; monthly: number; expiresAt: string; createdAt: string };
export type OrderStatus = "pending" | "checkout_open" | "active" | "payment_failed" | "canceled";
export type Order = { id: string; tenantId: string; accountId: string; quote: Quote; status: OrderStatus; providerSessionId?: string; providerCustomerId?: string; providerSubscriptionId?: string; createdAt: string; updatedAt: string };
export type Tenant = { tenantId: string; accountId: string; name: string };

export class DomainError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

export function computeQuote(catalog: Product[], cart: Cart, tenantId: string, now = new Date()): Quote {
  const items = [...cart.workers.map((item) => ({ ...item, kind: "worker" as const })), ...cart.credits.map((item) => ({ ...item, kind: "credit" as const }))];
  const ids = items.map((item) => item.priceId);
  if (new Set(ids).size !== ids.length) throw new DomainError("DUPLICATE_PRICE", "Each price may only appear once");
  const lines = items.map(({ priceId, quantity, kind }) => {
    const product = catalog.find((entry) => entry.kind === kind && entry.prices.some((price) => price.id === priceId && price.active));
    const price = product?.prices.find((entry) => entry.id === priceId && entry.active);
    if (!product || !price || (kind === "credit" && price.cadence !== "once") || (kind === "worker" && price.cadence === "once")) throw new DomainError("PRICE_UNAVAILABLE", "Unknown or inactive price");
    return { productId: product.id, productName: product.name.es, kind, priceId, priceVersion: price.version, cadence: price.cadence, unitAmount: price.amount, quantity, amount: price.amount * quantity };
  });
  const weekly = lines.filter((line) => line.cadence === "week").reduce((sum, line) => sum + line.amount, 0);
  const monthly = lines.filter((line) => line.cadence === "month").reduce((sum, line) => sum + line.amount, 0);
  const once = lines.filter((line) => line.cadence === "once").reduce((sum, line) => sum + line.amount, 0);
  return { id: crypto.randomUUID(), tenantId, currency: "usd", lines, dueNow: weekly + monthly + once, weekly, monthly, expiresAt: new Date(now.getTime() + 15 * 60_000).toISOString(), createdAt: now.toISOString() };
}
