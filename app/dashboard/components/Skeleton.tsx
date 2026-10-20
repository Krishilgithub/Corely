import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Neutral loading block. The colour and the soft pulse come from
 * .ui-skeleton in app/globals.css, so it works in light and dark mode.
 */
export function Skeleton({
  width = "100%",
  height = "20px",
  borderRadius = "6px",
  className = "",
  style,
}: SkeletonProps) {
  return (
    <div
      className={`skeleton-loader ui-skeleton ${className}`}
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}
