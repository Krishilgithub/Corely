"use client";

import { usePathname } from "next/navigation";
import { ReactLenis } from "lenis/react";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Disable Lenis smooth scrolling inside the dashboard to prevent scrolling issues
  if (pathname?.startsWith("/dashboard")) {
    return <>{children}</>;
  }

  return <ReactLenis root>{children}</ReactLenis>;
}
