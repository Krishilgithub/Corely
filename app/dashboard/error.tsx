"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div
      className="db-content"
      style={{ alignItems: "center", justifyContent: "center", minHeight: 500 }}
    >
      <EmptyState
        icon={<AlertTriangle />}
        title="Something went wrong"
        description="We encountered an unexpected error while loading this page. Our team has been notified."
        action={
          <button type="button" className="ui-btn ui-btn--secondary" onClick={() => reset()}>
            <RefreshCw />
            Try again
          </button>
        }
      />
    </div>
  );
}
