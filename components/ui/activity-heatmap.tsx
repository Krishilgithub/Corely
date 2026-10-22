"use client";

import { useMemo } from "react";
import { format, startOfWeek, addDays, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * A grid of days (columns are weeks, rows are weekdays) coloured by how much
 * happened that day. Data: [{ date: "YYYY-MM-DD", count }]. Days not listed count as 0.
 */
export function ActivityHeatmap({
  data,
  weeks = 18,
  unit = "update",
  className,
}: {
  data: Array<{ date: string; count: number }>;
  weeks?: number;
  unit?: string;
  className?: string;
}) {
  const { columns, maxCount, total } = useMemo(() => {
    const byDay = new Map(data.map(d => [d.date, d.count]));
    const first = startOfWeek(subWeeks(new Date(), weeks - 1), { weekStartsOn: 1 });
    const cols: Array<Array<{ date: Date; key: string; count: number; future: boolean }>> = [];
    let max = 0, sum = 0;
    const today = new Date();
    for (let w = 0; w < weeks; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(first, w * 7 + d);
        const key = format(date, "yyyy-MM-dd");
        const count = byDay.get(key) ?? 0;
        max = Math.max(max, count);
        sum += count;
        col.push({ date, key, count, future: date > today });
      }
      cols.push(col);
    }
    return { columns: cols, maxCount: max, total: sum };
  }, [data, weeks]);

  // Five levels: 0 = none, 1–4 = more activity.
  const level = (n: number) => (n === 0 || maxCount === 0 ? 0 : Math.min(4, Math.ceil((n / maxCount) * 4)));
  const plural = (n: number) => `${n} ${unit}${n === 1 ? "" : "s"}`;

  return (
    <div className={cn("ui-heatmap", className)}>
      <div className="ui-heatmap__grid" role="img" aria-label={`${plural(total)} in the last ${weeks} weeks`}>
        {columns.map((col, i) => (
          <div key={i} className="ui-heatmap__col">
            {col.map(cell => (
              <span
                key={cell.key}
                className="ui-heatmap__cell"
                data-level={cell.future ? "future" : level(cell.count)}
                title={cell.future ? undefined : `${format(cell.date, "d MMM yyyy")}: ${plural(cell.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="ui-heatmap__legend">
        <span className="type-caption">{plural(total)} in {weeks} weeks</span>
        <span className="ui-heatmap__scale" aria-hidden="true">
          Less {[0, 1, 2, 3, 4].map(l => <span key={l} className="ui-heatmap__cell" data-level={l} />)} More
        </span>
      </div>
    </div>
  );
}
