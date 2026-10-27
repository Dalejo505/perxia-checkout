import { z } from "zod";
import { DomainError } from "@/lib/domain";
import { identity } from "@/lib/identity";
import { repository } from "@/lib/repository";
import { paymentGateway } from "@/lib/payments";
import { apiError, json, sameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const tenant = await identity();
    const { customerId } = z.object({ customerId: z.string().min(1) }).parse(await request.json());
    const orders = await repository().orders(tenant.tenantId);
    if (!orders.some((order) => order.providerCustomerId === customerId)) throw new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
    return json({ url: await paymentGateway().portal(customerId, `${new URL(request.url).origin}/es/billing`) });
  } catch (error) { return apiError(error); }
}
