import "server-only";
import Stripe from "stripe";
import { DomainError, type Order } from "./domain";

export interface PaymentGateway {
  checkout(order: Order, origin: string): Promise<{ id: string; url: string }>;
  portal(customerId: string, returnUrl: string): Promise<string>;
  billing(customerId: string): Promise<BillingData>;
  verify(payload: string, signature: string): Stripe.Event;
  session(id: string): Promise<Stripe.Checkout.Session>;
}

export type BillingData = { paymentMethod: { brand: string; last4: string; expMonth: number; expYear: number } | null; invoices: { id: string; number: string | null; amount: number; status: string | null; hostedUrl: string | null; created: number }[]; subscriptions: { id: string; status: string; periodEnd: number | null }[]; upcoming: { amount: number; date: number | null } | null };

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new DomainError("PAYMENTS_UNAVAILABLE", "Stripe secret key is not configured in this deployment", 503);
  if (!key.startsWith("sk_test_")) throw new DomainError("PAYMENTS_UNAVAILABLE", "Stripe test secret key must start with sk_test_", 503);
  return new Stripe(key);
}

export function paymentGateway(): PaymentGateway {
  const stripe = stripeClient();
  return {
    async checkout(order, origin) {
      const recurring = order.quote.lines.filter((line) => line.cadence !== "once");
      const oneTime = order.quote.lines.filter((line) => line.cadence === "once");
      if (recurring.length === 0) throw new DomainError("INVALID_ORDER", "A recurring worker is required");
      if (recurring.reduce((sum, line) => sum + line.quantity, 0) > 100) throw new DomainError("INVALID_ORDER", "Too many workers");
      const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [...recurring, ...oneTime].map((line) => ({
        price_data: { currency: "usd", unit_amount: line.unitAmount, product_data: { name: line.productName, metadata: { productId: line.productId, priceId: line.priceId, priceVersion: String(line.priceVersion) } }, ...(line.cadence === "once" ? {} : { recurring: { interval: line.cadence } }) }, quantity: line.quantity,
      }));
      const session = await stripe.checkout.sessions.create({
        mode: "subscription", line_items, client_reference_id: order.id, metadata: { orderId: order.id, tenantId: order.tenantId },
        subscription_data: { metadata: { orderId: order.id, tenantId: order.tenantId } },
        success_url: `${origin}/es/orders/${order.id}?checkout=returned`, cancel_url: `${origin}/es/orders/${order.id}?checkout=canceled`,
      }, { idempotencyKey: `order-${order.id}` });
      if (!session.url) throw new DomainError("CHECKOUT_UNAVAILABLE", "Stripe did not provide a checkout URL", 502);
      return { id: session.id, url: session.url };
    },
    async portal(customerId, returnUrl) { const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl }); return session.url; },
    async billing(customerId) {
      const [customer, invoices, subscriptions] = await Promise.all([
        stripe.customers.retrieve(customerId, { expand: ["invoice_settings.default_payment_method"] }),
        stripe.invoices.list({ customer: customerId, limit: 20 }),
        stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 }),
      ]);
      const method = !customer.deleted && customer.invoice_settings.default_payment_method;
      const paymentMethod = method && typeof method !== "string" && method.card ? { brand: method.card.brand, last4: method.card.last4, expMonth: method.card.exp_month, expYear: method.card.exp_year } : null;
      const active = subscriptions.data.find((subscription) => subscription.status === "active" || subscription.status === "trialing");
      const upcoming = active ? await stripe.invoices.createPreview({ customer: customerId, subscription: active.id }).then((invoice) => ({ amount: invoice.amount_due, date: invoice.period_end ?? null })).catch(() => null) : null;
      return { paymentMethod, invoices: invoices.data.map((invoice) => ({ id: invoice.id, number: invoice.number, amount: invoice.amount_paid, status: invoice.status, hostedUrl: invoice.hosted_invoice_url ?? null, created: invoice.created })), subscriptions: subscriptions.data.map((subscription) => ({ id: subscription.id, status: subscription.status, periodEnd: subscription.items.data[0]?.current_period_end ?? null })), upcoming };
    },
    verify(payload, signature) {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!secret || !secret.startsWith("whsec_")) throw new DomainError("WEBHOOK_UNAVAILABLE", "Stripe webhook signing secret is required", 503);
      return stripe.webhooks.constructEvent(payload, signature, secret);
    },
    session(id) { return stripe.checkout.sessions.retrieve(id, { expand: ["subscription"] }); },
  };
}
