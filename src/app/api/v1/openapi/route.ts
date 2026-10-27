import { apiError, json } from "@/lib/http";
import { identity } from "@/lib/identity";
import { spec } from "@/lib/openapi";

export async function GET() {
  try { await identity(); return json(spec); } catch (error) { return apiError(error); }
}
