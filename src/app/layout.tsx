import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "PERXIA | Checkout", description: "Configure your PERXIA workspace and manage billing." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}<script defer src="/checkout-interactions.js" /></body></html>;
}
