import type { SVGProps } from "react";

/**
 * Corely logo mark: a "C" made of four offset blocks.
 * Upper blocks use the stone tone, lower blocks use charcoal, so the mark
 * stays neutral in light and dark mode (colours come from --logo-* tokens).
 */
export default function CorelyLogo({ size = 16, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path d="M13.55 3.34 A7.25 7.25 0 0 0 8.51 0.77 L8.29 3.91 A4.1 4.1 0 0 1 11.14 5.36 Z" fill="var(--logo-stone)" />
      <path d="M7.49 0.77 A7.25 7.25 0 0 0 0.77 7.49 L3.91 7.71 A4.1 4.1 0 0 1 7.71 3.91 Z" fill="var(--logo-stone)" />
      <path d="M0.77 8.51 A7.25 7.25 0 0 0 7.49 15.23 L7.71 12.09 A4.1 4.1 0 0 1 3.91 8.29 Z" fill="var(--logo-charcoal)" />
      <path d="M8.51 15.23 A7.25 7.25 0 0 0 13.55 12.66 L11.14 10.64 A4.1 4.1 0 0 1 8.29 12.09 Z" fill="var(--logo-charcoal)" />
    </svg>
  );
}
