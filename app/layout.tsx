import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Corely — Enterprise Intelligence Layer",
  description:
    "Corely transforms fragmented company knowledge into a unified intelligence layer that understands context, remembers what matters, and acts across your organization.",
  keywords: ["enterprise AI", "knowledge management", "organizational intelligence", "company brain"],
  openGraph: {
    title: "Corely — Enterprise Intelligence Layer",
    description: "Your Company Has Data. Now Give It Intelligence.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistSans.variable} h-full`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col antialiased bg-white text-[#111111]">{children}</body>
    </html>
  );
}
