import { repository } from "@/lib/repository";
import { paymentGateway } from "@/lib/payments";
import { applyStripeEvent } from "@/lib/webhook";
import { apiError, json } from "@/lib/http";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return json({ error: { code: "MISSING_SIGNATURE" } }, 400);
  try {
    const gateway = paymentGateway();
    const event = gateway.verify(await request.text(), signature);
    await applyStripeEvent(repository(), gateway, event);
    return json({ received: true });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("signature")) return json({ error: { code: "INVALID_SIGNATURE" } }, 400);
    return apiError(error);
  }
}
