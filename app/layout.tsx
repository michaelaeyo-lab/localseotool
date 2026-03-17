import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Local SEO Auditor - Professional Dashboard",
  description: "Professional-grade analysis and optimization for your Google Business Profile. Gain precision insights and execute actionable strategies to secure local search dominance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} bg-background-light dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100 antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
