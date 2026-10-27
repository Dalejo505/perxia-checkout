import { ArrowDownRight, ShieldCheck } from "lucide-react";
import { identity } from "@/lib/identity";
import { repository } from "@/lib/repository";
import { copy, type Locale } from "@/lib/i18n";
import { Checkout } from "@/components/checkout";

export default async function Page({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  const query = await searchParams;
  const t = copy[locale];
  let catalog = null;
  try { await identity(); catalog = await repository().catalog(); } catch { return null; }

  return <main className="mx-auto max-w-[1280px] px-5 pb-24 sm:px-9">
    <div className="grid gap-8 border-b border-[#d5e1d6] py-10 md:grid-cols-[minmax(0,1fr)_280px] md:items-end md:py-14">
      <div><p className="eyebrow">PERXIA / {t.catalog}</p><h1 className="mt-4 max-w-[790px] text-[clamp(2.7rem,5.6vw,5.3rem)] leading-[1.03] tracking-[-.045em]">{t.lead}</h1><p className="mt-5 max-w-[570px] text-sm leading-7 text-[#48594f] sm:text-base">{t.subtitle}</p></div>
      <div className="flex items-start gap-4 border-l-2 border-[#15601d] pl-5 md:mb-2"><ArrowDownRight className="mt-0.5 shrink-0 text-[#15601d]" size={21} aria-hidden="true" /><div><p className="text-sm font-semibold text-[#063635]">{t.configure}</p><p className="mt-2 flex items-start gap-2 text-xs leading-5 text-[#48594f]"><ShieldCheck size={16} className="shrink-0" aria-hidden="true" />{t.noCharge}</p></div></div>
    </div>
    <div className="pt-10"><Checkout products={catalog} locale={locale} initialState={query} /></div>
    <p className="mt-10 border-t border-[#d5e1d6] pt-5 text-xs text-[#48594f]">{t.fixture}</p>
  </main>;
}
