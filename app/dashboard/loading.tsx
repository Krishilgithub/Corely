"use client";

import { Skeleton } from "./components/Skeleton";

// Loading view for Home. The blocks follow the real layout:
// header, four KPI tiles, two cards side by side, then the actions card.
export default function DashboardLoading() {
  return (
    <div className="db-content" role="status" aria-busy="true" aria-label="Loading dashboard">
      {/* Page header: title and subtitle on the left, date button on the right */}
      <div className="ui-page-header">
        <div className="ui-page-header__text">
          <Skeleton width={280} height={34} borderRadius={8} style={{ maxWidth: "100%" }} />
          <Skeleton width={360} height={20} style={{ maxWidth: "100%" }} />
        </div>
        <Skeleton width={136} height={36} borderRadius={8} />
      </div>

      {/* KPI tiles */}
      <div className="db-stats-grid">
        <Skeleton height={140} borderRadius={12} />
        <Skeleton height={140} borderRadius={12} />
        <Skeleton height={140} borderRadius={12} />
        <Skeleton height={140} borderRadius={12} />
      </div>

      {/* Activity feed and insights */}
      <div className="db-main-grid">
        <Skeleton height={440} borderRadius={16} />
        <Skeleton height={440} borderRadius={16} />
      </div>

      {/* Autonomous actions */}
      <Skeleton height={200} borderRadius={16} />
    </div>
  );
}
