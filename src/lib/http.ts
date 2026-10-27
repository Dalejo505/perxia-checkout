import { ZodError } from "zod";
import { DomainError } from "./domain";

export function apiError(error: unknown) {
  if (error instanceof DomainError) return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  if (error instanceof ZodError) return Response.json({ error: { code: "INVALID_INPUT", message: "Invalid request", issues: error.issues } }, { status: 400 });
  if (error instanceof SyntaxError) return Response.json({ error: { code: "INVALID_JSON", message: "Invalid JSON" } }, { status: 400 });
  if (error instanceof Error && error.message.startsWith("Production storage unavailable")) return Response.json({ error: { code: "STORAGE_UNAVAILABLE", message: error.message } }, { status: 503 });
  return Response.json({ error: { code: "INTERNAL_ERROR", message: "Request could not be completed" } }, { status: 500 });
}

export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "no-store" } }); }

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) throw new DomainError("INVALID_ORIGIN", "Cross-origin mutation forbidden", 403);
}
