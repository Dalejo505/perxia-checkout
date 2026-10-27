import { identity } from "@/lib/identity";
import { repository } from "@/lib/repository";
import { createQuote } from "@/lib/service";
import { apiError, json, sameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  try { sameOrigin(request); const tenant = await identity(); return json({ quote: await createQuote(repository(), tenant, await request.json()) }, 201); }
  catch (error) { return apiError(error); }
}
