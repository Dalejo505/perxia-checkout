import { describe, expect, it } from "vitest";
import { createMemoryRepository } from "@/lib/repository";
import { createOrder, createQuote, requireOrder } from "@/lib/service";

const alice = { tenantId: "alice", accountId: "user-alice", name: "Alice" };
const bob = { tenantId: "bob", accountId: "user-bob", name: "Bob" };

describe("tenant-scoped checkout", () => {
  it("persists quotes and orders but never marks an order paid", async () => {
    const repo = createMemoryRepository();
    const quote = await createQuote(repo, alice, { workers: [{ priceId: "analyst-month-v1", quantity: 2 }] });
    const order = await createOrder(repo, alice, quote.id);
    expect((await requireOrder(repo, alice, order.id)).status).toBe("pending");
    await expect(requireOrder(repo, bob, order.id)).rejects.toMatchObject({ code: "ORDER_NOT_FOUND" });
    await expect(createOrder(repo, bob, quote.id)).rejects.toMatchObject({ code: "QUOTE_NOT_FOUND" });
  });
  it("rejects expired quotes", async () => {
    const repo = createMemoryRepository();
    const quote = await createQuote(repo, alice, { workers: [{ priceId: "analyst-week-v1", quantity: 1 }] });
    await repo.saveQuote({ ...quote, expiresAt: new Date(0).toISOString() });
    await expect(createOrder(repo, alice, quote.id)).rejects.toMatchObject({ code: "QUOTE_EXPIRED" });
  });
  it("retries failed events and deduplicates successful events", async () => {
    const repo = createMemoryRepository();
    await expect(repo.processEvent("evt-1", async () => { throw new Error("failure"); })).rejects.toThrow();
    expect(await repo.processEvent("evt-1", async () => false)).toBe(false);
    expect(await repo.processEvent("evt-1", async () => true)).toBe(true);
    expect(await repo.processEvent("evt-1", async () => { throw new Error("duplicate"); })).toBe(false);
  });
});
