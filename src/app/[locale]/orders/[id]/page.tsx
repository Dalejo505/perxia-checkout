import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { identity } from "@/lib/identity";
import { repository } from "@/lib/repository";
import { copy, money, type Locale } from "@/lib/i18n";
import { PaymentButton } from "@/components/actions";
import { Alert, Badge, Card, Separator } from "@/components/ui";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ locale: Locale; id: string }>; searchParams: Promise<{ checkout?: string }> }) {
  const { locale, id } = await params;
  const { checkout } = await searchParams;
  const t = copy[locale];
  let order;
  try { const tenant = await identity(); order = await repository().order(id, tenant.tenantId); } catch { return null; }
  if (!order && process.env.PERXIA_DEMO_MODE === "true") return <main className="mx-auto max-w-[760px] px-5 py-16 sm:px-9"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#15601d] hover:underline" href={`/${locale}`}><ArrowLeft size={16} aria-hidden="true" />{t.back}</Link><Card className="mt-8 border-t-4 border-t-[#15601d] p-7 sm:p-9"><p className="eyebrow">PERXIA / DEMO</p><h1 className="mt-3 text-4xl tracking-tight">Pedido de demostración</h1><p className="mt-4 max-w-xl text-sm leading-7 text-[#48594f]">El pedido no se conserva entre instancias de Vercel porque la demostración usa memoria temporal. Configura una base de datos transaccional antes de habilitar compras o pagos reales.</p><Link className="mt-7 inline-flex min-h-11 items-center rounded-[5px] bg-[#15601d] px-5 text-sm font-extrabold text-white hover:bg-[#063635]" href={`/${locale}`}>Volver al checkout</Link></Card></main>;
  if (!order) notFound();
  return <main className="mx-auto max-w-[1050px] px-5 py-12 sm:px-9 md:py-16"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#15601d] hover:underline" href={`/${locale}`}><ArrowLeft size={16} aria-hidden="true" />{t.back}</Link><div className="mt-10 flex flex-wrap items-end justify-between gap-5 border-b border-[#d5e1d6] pb-8"><div><p className="eyebrow">PERXIA / {t.orderDetails}</p><h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">{t.review}</h1><p className="mt-3 break-all text-xs text-[#48594f]">#{order.id}</p></div><Badge className={order.status === "active" ? "bg-[#ccffd6]" : "bg-[#e5f4e8]"}>{order.status === "active" ? t.active : t.pending}</Badge></div>
    {checkout === "returned" && <Alert className="mt-6">{t.returned}</Alert>}{checkout === "canceled" && <Alert tone="warning" className="mt-6">{t.canceled}</Alert>}
    <div className="mt-8 grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_310px]"><Card className="p-6 sm:p-8"><h2 className="text-xl">{t.orderDetails}</h2><div className="mt-5 divide-y divide-[#d5e1d6]">{order.quote.lines.map((line) => <div key={line.priceId} className="flex justify-between gap-4 py-5 text-sm"><div><p className="font-semibold text-[#063635]">{line.productName} × {line.quantity}</p><p className="mt-1 text-xs text-[#48594f]">{line.cadence === "once" ? t.once : line.cadence === "week" ? t.weekly : t.monthly} · v{line.priceVersion}</p></div><span className="shrink-0 font-semibold">{money(line.amount, locale)}</span></div>)}</div></Card><Card className="overflow-hidden border-[#b8cdbb]"><div className="bg-[#063635] px-6 py-5 text-white"><p className="text-xs font-semibold uppercase tracking-widest text-[#6dfd8c]">{t.summary}</p><h2 className="mt-2 text-xl">{t.secureCheckout}</h2></div><div className="space-y-5 p-6"><div><p className="text-xs text-[#48594f]">{t.estimate}</p><strong className="mt-2 block text-3xl tracking-tight text-[#063635]">{money(order.quote.dueNow, locale)}</strong></div><Separator />{order.status === "pending" && <PaymentButton orderId={order.id} locale={locale} />}<p className="flex items-start gap-2 text-xs leading-5 text-[#48594f]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#15601d]" aria-hidden="true" />{t.noCharge}</p></div></Card></div>
  </main>;
}
