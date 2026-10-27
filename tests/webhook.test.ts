import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { createMemoryRepository } from "@/lib/repository";
import { createOrder, createQuote } from "@/lib/service";
import { applyStripeEvent } from "@/lib/webhook";
import type { PaymentGateway } from "@/lib/payments";

const tenant = { tenantId: "t1", accountId: "a1", name: "Test" };

describe("verified checkout events", () => {
  it("activates only after fetching a paid, complete session and ignores duplicate events", async () => {
    const repo = createMemoryRepository();
    const quote = await createQuote(repo, tenant, { workers: [{ priceId: "analyst-month-v1", quantity: 1 }] });
    const order = await createOrder(repo, tenant, quote.id);
    await repo.saveOrder({ ...order, providerSessionId: "cs_test_1", status: "checkout_open" });
    const session = vi.fn().mockResolvedValue({ id: "cs_test_1", client_reference_id: order.id, metadata: { orderId: order.id, tenantId: "t1" }, payment_status: "unpaid", status: "complete", customer: "cus_1", subscription: "sub_1" });
    const gateway = { session } as unknown as PaymentGateway;
    const event = { id: "evt_1", type: "checkout.session.completed", data: { object: { id: "cs_test_1", client_reference_id: order.id, metadata: { orderId: order.id, tenantId: "t1" } } } } as unknown as Stripe.Event;
    await applyStripeEvent(repo, gateway, event);
    expect((await repo.order(order.id, "t1"))?.status).toBe("checkout_open");
    expect(session).toHaveBeenCalledTimes(1);
    session.mockResolvedValue({ id: "cs_test_1", client_reference_id: order.id, metadata: { tenantId: "t1" }, payment_status: "paid", status: "complete", customer: "cus_1", subscription: "sub_1" });
    expect(await applyStripeEvent(repo, gateway, { ...event, id: "evt_2" })).toBe(true);
    expect((await repo.order(order.id, "t1"))?.status).toBe("active");
    expect(await applyStripeEvent(repo, gateway, { ...event, id: "evt_2" })).toBe(false);
  });
  it("does not activate cross-tenant or unknown provider sessions", async () => {
    const repo = createMemoryRepository();
    const gateway = { session: vi.fn() } as unknown as PaymentGateway;
    const event = { id: "evt_3", type: "checkout.session.completed", data: { object: { id: "unknown" } } } as unknown as Stripe.Event;
    await applyStripeEvent(repo, gateway, event);
    expect(gateway.session).not.toHaveBeenCalled();
  });
});
