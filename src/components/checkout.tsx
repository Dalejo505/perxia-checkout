"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Minus, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Separator, cn } from "./ui";
import type { Product } from "@/lib/domain";
import { copy, money, type Locale } from "@/lib/i18n";

type SearchState = Record<string, string | string[] | undefined>;

async function send(path: string, body: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "Request failed");
  return data;
}

function quantity(value: string | string[] | undefined, fallback = 0) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 100 ? parsed : fallback;
}

export function Checkout({ products, locale, initialState }: { products: Product[]; locale: Locale; initialState: SearchState }) {
  const t = copy[locale];
  const router = useRouter();
  const workers = products.filter((product) => product.kind === "worker");
  const credits = products.filter((product) => product.kind === "credit");
  const [busy, setBusy] = useState(false);
  const cadenceFor = (id: string) => initialState[id] === "week" ? "week" : "month";
  const countFor = (id: string) => quantity(initialState[`quantity-${id}`], id === workers[0]?.id ? 1 : 0);
  const selected = products.flatMap((product) => {
    const cadence = product.kind === "worker" ? cadenceFor(product.id) : "once";
    const price = product.prices.find((entry) => entry.active && entry.cadence === cadence);
    const itemQuantity = countFor(product.id);
    return price && itemQuantity > 0 ? [{ product, price, quantity: itemQuantity }] : [];
  });
  const due = selected.reduce((sum, item) => sum + item.price.amount * item.quantity, 0);
  const weekly = selected.filter((item) => item.price.cadence === "week").reduce((sum, item) => sum + item.price.amount * item.quantity, 0);
  const monthly = selected.filter((item) => item.price.cadence === "month").reduce((sum, item) => sum + item.price.amount * item.quantity, 0);
  const once = selected.filter((item) => item.price.cadence === "once").reduce((sum, item) => sum + item.price.amount * item.quantity, 0);

  async function proceed() {
    setBusy(true);
    try {
      const quote = await send("/api/v1/quotes", { workers: selected.filter((item) => item.product.kind === "worker").map((item) => ({ priceId: item.price.id, quantity: item.quantity })), credits: selected.filter((item) => item.product.kind === "credit").map((item) => ({ priceId: item.price.id, quantity: item.quantity })) });
      const order = await send("/api/v1/orders", { quoteId: quote.quote.id });
      router.push(`/${locale}/orders/${order.order.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.error);
      setBusy(false);
    }
  }

  const quantityControls = (product: Product, count: number) => <div className="flex shrink-0 items-center rounded-[5px] border border-[#b8cdbb] bg-white p-0.5"><button type="button" data-quantity-action="decrement" aria-label={`${t.quantity} - ${product.name[locale]}`} disabled={count === 0} className="quantity-button"><Minus size={16} /></button><output data-count-output className="w-8 text-center text-sm font-semibold" aria-label={`${product.name[locale]}: ${count}`}>{count}</output><button type="button" data-quantity-action="increment" aria-label={`${t.quantity} + ${product.name[locale]}`} disabled={count >= 100} className="quantity-button"><Plus size={16} /></button></div>;

  return <div data-checkout-root data-weekly={t.weekly} data-monthly={t.monthly} data-once={t.once} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_350px] xl:gap-12"><div className="space-y-10"><section aria-labelledby="workers-heading"><div className="mb-5"><p className="eyebrow">01 / {t.configure}</p><h2 id="workers-heading" className="mt-2 text-[1.75rem] leading-tight tracking-tight sm:text-3xl">{t.workers}</h2></div><div className="grid gap-3">{workers.map((product, index) => { const cadence = cadenceFor(product.id); const price = product.prices.find((item) => item.cadence === cadence && item.active); const count = countFor(product.id); return <Card key={product.id} data-checkout-item data-name={product.name[locale]} data-cadence={cadence} data-count={count} data-week-price={product.prices.find((item) => item.cadence === "week")?.amount} data-month-price={product.prices.find((item) => item.cadence === "month")?.amount} data-week-label={t.perWeek} data-month-label={t.perMonth} className={cn("flex flex-col gap-5 p-5 transition-[border-color,background-color] sm:flex-row sm:items-center sm:justify-between sm:gap-6", count > 0 && "border-[#15601d] bg-[#f4fff6]")}><div className="flex min-w-0 items-start gap-4"><span aria-hidden="true" className={cn("display flex size-10 shrink-0 items-center justify-center rounded-[5px] bg-[#edf5ee] text-sm text-[#15601d]", count > 0 && "bg-[#15601d] text-white")}>{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><h3 className="text-base leading-tight">{product.name[locale]}</h3><p className="mt-1.5 text-xs leading-5 text-[#48594f] sm:text-sm">{product.description[locale]}</p><p className="mt-3 text-base font-bold text-[#063635]"><span data-price>{price ? money(price.amount, locale) : "—"}</span> <span data-price-cadence className="text-xs font-normal text-[#48594f]">/ {cadence === "week" ? t.perWeek : t.perMonth}</span></p></div></div><div className="flex shrink-0 items-center justify-between gap-3 pl-14 sm:flex-col sm:items-end sm:pl-0"><fieldset className="flex rounded-[5px] border border-[#b8cdbb] bg-white p-0.5" aria-label={`${t.cadence} · ${product.name[locale]}`}><legend className="sr-only">{t.cadence} · {product.name[locale]}</legend>{(["month", "week"] as const).map((option) => <button key={option} type="button" data-cadence={option} aria-pressed={cadence === option} className={cn("min-h-9 rounded-[3px] px-3 text-xs font-bold transition-[background-color,color]", cadence === option ? "bg-[#063635] text-white" : "text-[#48594f] hover:bg-[#e8f7eb] hover:text-[#063635]")}>{option === "month" ? t.monthly : t.weekly}</button>)}</fieldset>{quantityControls(product, count)}</div></Card>; })}</div></section><section aria-labelledby="credits-heading"><p className="eyebrow">02 / {t.configure}</p><h2 id="credits-heading" className="mb-5 mt-2 text-[1.75rem] leading-tight tracking-tight sm:text-3xl">{t.credits}</h2><div className="grid gap-3 sm:grid-cols-2">{credits.map((product) => { const price = product.prices.find((item) => item.active); const count = countFor(product.id); return <Card key={product.id} data-checkout-item data-name={product.name[locale]} data-cadence="once" data-count={count} data-once-price={price?.amount} data-once-label={t.once} className={cn("flex flex-col justify-between gap-7 p-5 transition-[border-color,background-color]", count > 0 && "border-[#15601d] bg-[#f4fff6]")}><div className="flex items-start justify-between gap-3"><div><Sparkles size={19} className="mb-4 text-[#15601d]" aria-hidden="true" /><h3 className="text-base">{product.name[locale]}</h3><p className="mt-1.5 text-xs leading-5 text-[#48594f] sm:text-sm">{product.description[locale]}</p></div>{count > 0 && <Check className="shrink-0 text-[#15601d]" size={18} aria-hidden="true" />}</div><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-[#063635]">{price ? money(price.amount, locale) : "—"} <span className="text-xs font-normal text-[#48594f]">/ {t.once}</span></p>{quantityControls(product, count)}</div></Card>; })}</div></section></div><aside aria-label={t.summary} className="lg:sticky lg:top-6"><Card className="overflow-hidden border-[#b8cdbb] shadow-[0_18px_50px_rgba(6,54,53,.07)]"><div className="bg-[#063635] px-6 py-6 text-white"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6dfd8c]">03 / {t.summary}</p><h2 className="mt-2 text-2xl">{t.summary}</h2></div><div className="space-y-5 p-6"><div data-summary-lines aria-live="polite" className="space-y-4">{selected.map(({ product, price, quantity: itemQuantity }) => <div key={product.id} className="flex justify-between gap-3 text-sm"><div className="min-w-0"><p className="font-semibold text-[#063635]">{product.name[locale]} <span className="whitespace-nowrap text-[#48594f]">× {itemQuantity}</span></p><p className="mt-1 text-xs text-[#48594f]">{price.cadence === "once" ? t.once : price.cadence === "week" ? t.weekly : t.monthly}</p></div><span className="shrink-0 font-semibold">{money(price.amount * itemQuantity, locale)}</span></div>)}</div><Separator /><div className="space-y-2 text-xs text-[#48594f]">{weekly > 0 && <div className="flex justify-between"><span>{t.recurring} / {t.weekly}</span><span data-summary-weekly>{money(weekly, locale)}</span></div>}{monthly > 0 && <div className="flex justify-between"><span>{t.recurring} / {t.monthly}</span><span data-summary-monthly>{money(monthly, locale)}</span></div>}{once > 0 && <div className="flex justify-between"><span>{t.oneTimeTotal}</span><span data-summary-once>{money(once, locale)}</span></div>}</div><div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[#d5e1d6] pt-4"><span className="text-sm font-semibold">{t.estimate}</span><strong data-summary-due className="text-2xl tracking-tight text-[#063635]">{money(due, locale)}</strong></div><Button data-checkout-action className="w-full" disabled={busy || weekly + monthly === 0} aria-busy={busy} onClick={proceed}>{busy ? t.loading : t.continue}<ArrowRight size={17} aria-hidden="true" /></Button><p className="flex items-start gap-2 text-xs leading-5 text-[#48594f]"><ShieldCheck className="mt-0.5 shrink-0 text-[#15601d]" size={16} aria-hidden="true" />{t.noCharge}</p></div></Card></aside></div>;
}
