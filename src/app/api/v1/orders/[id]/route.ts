import { identity } from "@/lib/identity";
import { repository } from "@/lib/repository";
import { requireOrder } from "@/lib/service";
import { apiError, json } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const tenant = await identity(); return json({ order: await requireOrder(repository(), tenant, (await params).id) }); }
  catch (error) { return apiError(error); }
}
