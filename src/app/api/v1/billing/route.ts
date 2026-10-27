import { identity } from "@/lib/identity";
import { repository } from "@/lib/repository";
import { paymentGateway } from "@/lib/payments";
import { apiError, json } from "@/lib/http";

export async function GET() {
  try {
    const tenant = await identity();
    const orders = await repository().orders(tenant.tenantId);
    const customers = [...new Set(orders.map((order) => order.providerCustomerId).filter((id): id is string => Boolean(id)))];
    const records = await Promise.all(customers.map(async (id) => ({ customerId: id, ...await paymentGateway().billing(id) })));
    return json({ orders, records });
  } catch (error) { return apiError(error); }
}
