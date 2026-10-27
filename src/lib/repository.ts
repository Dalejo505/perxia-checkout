import "server-only";
import type { Order, Product, Quote } from "./domain";
import { developmentCatalog } from "./fixture";

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

const globalRepository = globalThis as typeof globalThis & { __perxiaCheckoutRepository?: MemoryRepository };

export function repository(): CheckoutRepository {
  if (process.env.NODE_ENV === "production" && process.env.PERXIA_DEMO_MODE !== "true") throw new Error("Production storage unavailable: a durable transactional repository adapter is required");
  return (globalRepository.__perxiaCheckoutRepository ??= new MemoryRepository());
}

export function createMemoryRepository(): CheckoutRepository { return new MemoryRepository(); }
