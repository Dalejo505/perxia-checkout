import { identity } from "@/lib/identity";
import { repository } from "@/lib/repository";
import { apiError, json } from "@/lib/http";

export async function GET() {
  try { await identity(); return json({ products: await repository().catalog(), commercial: false }); }
  catch (error) { return apiError(error); }
}
