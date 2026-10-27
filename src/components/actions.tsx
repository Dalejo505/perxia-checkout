"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, CreditCard } from "lucide-react";
import { Button } from "./ui";
import { copy, type Locale } from "@/lib/i18n";

export function PaymentButton({ orderId, locale }: { orderId: string; locale: Locale }) {
  const [busy, setBusy] = useState(false);
  const t = copy[locale];
  return <Button disabled={busy} aria-busy={busy} onClick={async () => { setBusy(true); try { const response = await fetch(`/api/v1/orders/${encodeURIComponent(orderId)}/checkout`, { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? t.error); window.location.assign(data.url); } catch (error) { toast.error(error instanceof Error ? error.message : t.error); setBusy(false); } }}><CreditCard size={17} />{t.pay}<ArrowUpRight size={16} /></Button>;
}

export function PortalButton({ customerId, locale }: { customerId: string; locale: Locale }) {
  const [busy, setBusy] = useState(false);
  const t = copy[locale];
  return <Button variant="secondary" disabled={busy} aria-busy={busy} onClick={async () => { setBusy(true); try { const response = await fetch("/api/v1/billing/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? t.error); window.location.assign(data.url); } catch (error) { toast.error(error instanceof Error ? error.message : t.error); setBusy(false); } }}>{t.manage}<ArrowUpRight size={16} /></Button>;
}
