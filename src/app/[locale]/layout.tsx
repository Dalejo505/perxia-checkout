import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { copy, locales, type Locale } from "@/lib/i18n";
import { SignIn } from "@/components/sign-in";
import { Alert } from "@/components/ui";


export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: value } = await params;
  if (!locales.includes(value as Locale)) notFound();
  const locale = value as Locale;
  const t = copy[locale];
  const demoMode = process.env.PERXIA_DEMO_MODE === "true";
  const session = process.env.NODE_ENV === "production" && !demoMode ? null : await auth();
  const signedIn = Boolean(session?.tenantId && session.accountId);
  const productionBlocked = process.env.NODE_ENV === "production" && !demoMode;
  const localMode = process.env.AUTH_MODE === "local" && (process.env.NODE_ENV !== "production" || demoMode);
  const registerError = (await cookies()).get("perxia-register-error")?.value === "email-exists";
  return <div className="min-h-screen">
    <a href="#main-content" className="skip-link">{t.skipContent}</a>
    <header className="border-b border-[#214b39] bg-black text-white"><div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 sm:px-9">
      <Link href={`/${locale}`} className="flex min-w-0 items-center gap-3" aria-label="Periferia IT Group / PERXIA"><Image src="/brand/periferia-it-group.webp" alt="Periferia IT Group" width={156} height={46} className="h-10 w-auto max-w-[140px] object-contain object-left" priority /><span className="border-l border-[#48674e] pl-3 font-['Outfit'] text-xs font-extrabold tracking-[.16em] text-[#6dfd8c]">PERXIA</span></Link>
      <nav aria-label={t.navigation} className="flex items-center gap-4 text-sm sm:gap-7"><Link className="nav-link" href={`/${locale}`}>{t.checkout}</Link><Link className="nav-link" href={`/${locale}/billing`}>{t.billing}</Link><span className="hidden h-5 w-px bg-[#48674e] sm:block" /><span className="flex gap-2.5 text-xs" aria-label={t.language}>{locales.map((item) => <Link href={`/${item}`} key={item} lang={item} aria-label={item} aria-current={item === locale ? "page" : undefined} className={item === locale ? "font-bold text-[#6dfd8c]" : "text-[#c0d7c4] hover:text-white"}>{item === "pt-BR" ? "PT" : item.toUpperCase()}</Link>)}</span><span className="hidden max-w-36 truncate text-xs text-[#c0d7c4] lg:inline">{signedIn ? session?.user?.name : t.account}</span></nav>
    </div></header>
    <div id="main-content">{productionBlocked ? <main className="mx-auto max-w-2xl px-5 py-20"><Alert><h1 className="text-2xl">Checkout unavailable</h1><p className="mt-3">A durable transactional repository is required before production use.</p></Alert></main> : signedIn ? children : <SignIn locale={locale} local={localMode} registerError={registerError} />}</div>
    <Toaster richColors position="bottom-right" />
  </div>;
}
