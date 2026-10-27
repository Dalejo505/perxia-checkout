import "server-only";
import type { Order, Product, Quote } from "./domain";
import { developmentCatalog } from "./fixture";
import { prisma } from "./prisma";

export interface CheckoutRepository {
  catalog(): Promise<Product[]>;
  saveQuote(quote: Quote): Promise<void>;
  quote(id: string, tenantId: string): Promise<Quote | null>;
  saveOrder(order: Order): Promise<void>;
  order(id: string, tenantId: string): Promise<Order | null>;
  orderByProviderSession(id: string): Promise<Order | null>;
  ordersByProviderSubscription(id: string): Promise<Order[]>;
  orders(tenantId: string): Promise<Order[]>;
  processEvent(id: string, handler: () => Promise<boolean>): Promise<boolean>;
}

class MemoryRepository implements CheckoutRepository {
  private quotes = new Map<string, Quote>();
  private orderData = new Map<string, Order>();
  private processedEvents = new Set<string>();
  private processingEvents = new Set<string>();

  async catalog() { return structuredClone(developmentCatalog); }
  async saveQuote(quote: Quote) { this.quotes.set(quote.id, structuredClone(quote)); }
  async quote(id: string, tenantId: string) { const quote = this.quotes.get(id); return quote?.tenantId === tenantId ? structuredClone(quote) : null; }
  async saveOrder(order: Order) { this.orderData.set(order.id, structuredClone(order)); }
  async order(id: string, tenantId: string) { const order = this.orderData.get(id); return order?.tenantId === tenantId ? structuredClone(order) : null; }
  async orderByProviderSession(id: string) { const order = [...this.orderData.values()].find((item) => item.providerSessionId === id); return order ? structuredClone(order) : null; }
  async ordersByProviderSubscription(id: string) { return [...this.orderData.values()].filter((item) => item.providerSubscriptionId === id).map((item) => structuredClone(item)); }
  async orders(tenantId: string) { return [...this.orderData.values()].filter((item) => item.tenantId === tenantId).map((item) => structuredClone(item)); }
  async processEvent(id: string, handler: () => Promise<boolean>) {
    if (this.processedEvents.has(id) || this.processingEvents.has(id)) return false;
    this.processingEvents.add(id);
    try { const applied = await handler(); if (applied) this.processedEvents.add(id); return applied; }
    finally { this.processingEvents.delete(id); }
  }
}

class PrismaRepository implements CheckoutRepository {
  async catalog() { return structuredClone(developmentCatalog); }
  async saveQuote(quote: Quote) {
    await prisma.checkoutQuote.upsert({ where: { id: quote.id }, create: { id: quote.id, tenantId: quote.tenantId, payload: quote, expiresAt: new Date(quote.expiresAt), createdAt: new Date(quote.createdAt) }, update: { payload: quote, expiresAt: new Date(quote.expiresAt) } });
  }
  async quote(id: string, tenantId: string) {
    const quote = await prisma.checkoutQuote.findFirst({ where: { id, tenantId } });
    return quote ? quote.payload as unknown as Quote : null;
  }
  async saveOrder(order: Order) {
    await prisma.checkoutOrder.upsert({ where: { id: order.id }, create: { id: order.id, tenantId: order.tenantId, accountId: order.accountId, payload: order, providerSessionId: order.providerSessionId, providerCustomerId: order.providerCustomerId, providerSubscriptionId: order.providerSubscriptionId, status: order.status, createdAt: new Date(order.createdAt), updatedAt: new Date(order.updatedAt) }, update: { payload: order, providerSessionId: order.providerSessionId, providerCustomerId: order.providerCustomerId, providerSubscriptionId: order.providerSubscriptionId, status: order.status, updatedAt: new Date(order.updatedAt) } });
  }
  async order(id: string, tenantId: string) {
    const order = await prisma.checkoutOrder.findFirst({ where: { id, tenantId } });
    return order ? order.payload as unknown as Order : null;
  }
  async orderByProviderSession(providerSessionId: string) {
    const order = await prisma.checkoutOrder.findUnique({ where: { providerSessionId } });
    return order ? order.payload as unknown as Order : null;
  }
  async ordersByProviderSubscription(providerSubscriptionId: string) {
    const orders = await prisma.checkoutOrder.findMany({ where: { providerSubscriptionId } });
    return orders.map((order) => order.payload as unknown as Order);
  }
  async orders(tenantId: string) {
    const orders = await prisma.checkoutOrder.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
    return orders.map((order) => order.payload as unknown as Order);
  }
  async processEvent(id: string, handler: () => Promise<boolean>) {
    try { await prisma.stripeEvent.create({ data: { id, processedAt: new Date() } }); }
    catch { return false; }
    const applied = await handler();
    if (!applied) await prisma.stripeEvent.delete({ where: { id } }).catch(() => undefined);
    return applied;
  }
}

const globalRepository = globalThis as typeof globalThis & { perxiaCheckoutRepository?: MemoryRepository; perxiaPrismaRepository?: PrismaRepository };

export function repository(): CheckoutRepository {
  if (process.env.DATABASE_URL) return (globalRepository.perxiaPrismaRepository ??= new PrismaRepository());
  if (process.env.NODE_ENV === "production") throw new Error("Production storage unavailable: configure DATABASE_URL and deploy Prisma migrations");
  return (globalRepository.perxiaCheckoutRepository ??= new MemoryRepository());
}

export function createMemoryRepository(): CheckoutRepository { return new MemoryRepository(); }
