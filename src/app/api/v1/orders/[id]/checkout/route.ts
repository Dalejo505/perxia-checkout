import { DomainError } from "@/lib/domain";
import { identity } from "@/lib/identity";
import { repository } from "@/lib/repository";
import { requireOrder } from "@/lib/service";
import { paymentGateway } from "@/lib/payments";
import { apiError, json, sameOrigin } from "@/lib/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    const tenant = await identity();
    const repo = repository();
    const order = await requireOrder(repo, tenant, (await params).id);
    if (order.status !== "pending") throw new DomainError("ORDER_NOT_PENDING", "Checkout was already started", 409);
    if (new Date(order.quote.expiresAt).getTime() <= Date.now()) throw new DomainError("QUOTE_EXPIRED", "Create a new quote", 409);
    const result = await paymentGateway().checkout(order, new URL(request.url).origin);
    await repo.saveOrder({ ...order, providerSessionId: result.id, status: "checkout_open", updatedAt: new Date().toISOString() });
    return json({ url: result.url });
  } catch (error) { return apiError(error); }
}
