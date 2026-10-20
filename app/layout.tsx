import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import LenisProvider from "./components/LenisProvider";
import { AuthProvider } from "./lib/auth-context";
import { ThemeProvider } from "../components/ThemeProvider";

// Runs before the first paint so the page never flashes the wrong theme or
// sidebar width. Keys match components/ThemeProvider.tsx and the dashboard Sidebar.
const bootScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("corely-theme")||"system";var dark=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark)d.classList.add("dark");if(localStorage.getItem("corely-sidebar")==="collapsed")d.setAttribute("data-sidebar","collapsed");}catch(e){}})();`;

// Geist is the only typeface. Mono is for code and window-chrome labels only.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans antialiased bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <LenisProvider>
              {children}
            </LenisProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
