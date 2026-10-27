import "server-only";
import type Stripe from "stripe";
import type { PaymentGateway } from "./payments";
import type { CheckoutRepository } from "./repository";

export async function applyStripeEvent(repo: CheckoutRepository, gateway: PaymentGateway, event: Stripe.Event) {
  return repo.processEvent(event.id, async () => {
    if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded" && event.type !== "checkout.session.async_payment_failed" && event.type !== "invoice.payment_failed" && event.type !== "customer.subscription.deleted") return true;
    if (event.type === "invoice.payment_failed" || event.type === "customer.subscription.deleted") {
      const object = event.data.object as Stripe.Invoice | Stripe.Subscription;
      const subscriptionId = event.type === "customer.subscription.deleted" ? object.id : (object as Stripe.Invoice).parent?.subscription_details?.subscription;
      if (!subscriptionId) return false;
      const candidates = await repo.ordersByProviderSubscription(typeof subscriptionId === "string" ? subscriptionId : subscriptionId.id);
      const providerCustomer = object.customer;
      for (const order of candidates) {
        if (!providerCustomer || order.providerCustomerId !== (typeof providerCustomer === "string" ? providerCustomer : providerCustomer.id)) continue;
        await repo.saveOrder({ ...order, status: event.type === "customer.subscription.deleted" ? "canceled" : "payment_failed", updatedAt: new Date().toISOString() });
      }
      return candidates.length > 0;
    }
    const payload = event.data.object as Stripe.Checkout.Session;
    const order = await repo.orderByProviderSession(payload.id);
    if (!order || order.id !== payload.client_reference_id || order.id !== payload.metadata?.orderId || order.tenantId !== payload.metadata?.tenantId) return false;
    const confirmed = await gateway.session(payload.id);
    if (confirmed.id !== order.providerSessionId || confirmed.client_reference_id !== order.id || confirmed.metadata?.tenantId !== order.tenantId) return false;
    if (event.type === "checkout.session.async_payment_failed") {
      if (order.status !== "active") await repo.saveOrder({ ...order, status: "payment_failed", updatedAt: new Date().toISOString() });
      return true;
    }
    if (confirmed.payment_status !== "paid" || confirmed.status !== "complete" || !confirmed.customer || !confirmed.subscription) return false;
    await repo.saveOrder({ ...order, status: "active", providerCustomerId: typeof confirmed.customer === "string" ? confirmed.customer : confirmed.customer.id, providerSubscriptionId: typeof confirmed.subscription === "string" ? confirmed.subscription : confirmed.subscription.id, updatedAt: new Date().toISOString() });
    return true;
  });
}
