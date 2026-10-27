import { z } from "zod";
import { identity } from "@/lib/identity";
import { repository } from "@/lib/repository";
import { createOrder } from "@/lib/service";
import { apiError, json, sameOrigin } from "@/lib/http";

export async function GET() {
  try { const tenant = await identity(); return json({ orders: await repository().orders(tenant.tenantId) }); }
  catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try { sameOrigin(request); const tenant = await identity(); const { quoteId } = z.object({ quoteId: z.string().uuid() }).parse(await request.json()); return json({ order: await createOrder(repository(), tenant, quoteId) }, 201); }
  catch (error) { return apiError(error); }
}
