"use client";

import dynamic from "next/dynamic";
import type { Product } from "@/lib/domain";
import type { Locale } from "@/lib/i18n";
import { Skeleton } from "./ui";

const Checkout = dynamic(() => import("./checkout").then((module) => module.Checkout), {
  ssr: false,
  loading: () => <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_350px]"><div className="space-y-3"><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div><Skeleton className="h-96" /></div>,
});

export function CheckoutShell({ products, locale }: { products: Product[]; locale: Locale }) {
  return <Checkout products={products} locale={locale} initialState={{}} />;
}
