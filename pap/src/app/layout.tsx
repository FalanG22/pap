import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ErrorSuppressor } from "@/components/shared/ErrorSuppressor";
import { MetaMaskBlocker } from "@/components/shared/MetaMaskBlocker";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PAP Diagnóstico — Sistema de Gestión Citológica",
  description: "Plataforma SaaS multi-laboratorio para diagnóstico de Papanicolaou",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <MetaMaskBlocker />
        <ErrorSuppressor />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
