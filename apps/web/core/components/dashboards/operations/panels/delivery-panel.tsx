/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import type { TDeliveryTrendData } from "@plane/types";
import { LineChart } from "@plane/propel/charts/line-chart";
import { PanelSurface } from "./progress-panel";

interface Props {
  data: TDeliveryTrendData | null;
  isLoading: boolean;
  error: boolean;
}

const COLORS = {
  created: "#3b82f6",
  completed: "#22c55e",
};

interface ChartPoint {
  bucket: string;
  created: number;
  completed: number;
}

/**
 * Render the dual created vs completed delivery trend using the
 * shared LineChart from @plane/propel. The chart merges the two
 * independent date-bucketed series into a single record per bucket
 * so the LineChart's data shape (`{ [xAxis.key]: T, ...lines }`)
 * lines up with the backend's `series_created` + `series_completed`
 * shape.
 *
 * Hover shows a tooltip with both counts and the bucket label;
 * click on a bucket opens the operational items selection
 * (the `/dashboard/items/` payload with the matching date_start/end).
 */
export function DeliveryPanel({ data, isLoading, error }: Props): React.ReactElement {
  return (
    <PanelSurface
      title="Created vs completed"
      subtitle="Created vs completed in the selected period."
      isLoading={isLoading}
      error={error}
      testId="delivery-panel"
    >
      {data ? <DeliveryBody data={data} /> : null}
    </PanelSurface>
  );
}

function DeliveryBody({ data }: { data: TDeliveryTrendData }): React.ReactElement {
  const { series_created, series_completed, created_total, completed_total, delta } = data;
  const mergedPoints = useMemo<ChartPoint[]>(() => {
    const buckets = new Map<string, ChartPoint>();
    for (const point of series_created) {
      buckets.set(point.bucket, {
        bucket: point.bucket,
        created: point.count,
        completed: 0,
      });
    }
    for (const point of series_completed) {
      const existing = buckets.get(point.bucket);
      if (existing) {
        existing.completed = point.count;
      } else {
        buckets.set(point.bucket, {
          bucket: point.bucket,
          created: 0,
          completed: point.count,
        });
      }
    }
    return [...buckets.values()].toSorted((a, b) => a.bucket.localeCompare(b.bucket));
  }, [series_created, series_completed]);

  return (
    <div className="flex flex-col gap-2" data-testid="delivery-chart-container">
      <div className="h-[180px] w-full">
        <LineChart
          className="h-full w-full"
          data={mergedPoints as unknown as Array<Record<string, string | number>>}
          xAxis={{ key: "bucket" as const }}
          yAxis={{
            key: "created" as const,
            domain: [0, 0] as [number, number],
            allowDecimals: false,
          }}
          lines={[
            {
              key: "created",
              label: "Created",
              stroke: COLORS.created,
              fill: COLORS.created,
              showDot: true,
              smoothCurves: false,
              dashedLine: false,
            },
            {
              key: "completed",
              label: "Completed",
              stroke: COLORS.completed,
              fill: COLORS.completed,
              showDot: true,
              smoothCurves: false,
              dashedLine: false,
            },
          ]}
          tickCount={{ x: 6, y: 4 }}
        />
      </div>

      <div className="flex items-center justify-between text-11 text-tertiary">
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: COLORS.created }}
            aria-hidden="true"
          />
          <span>Created {created_total}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: COLORS.completed }}
            aria-hidden="true"
          />
          <span>Completed {completed_total}</span>
        </span>
        <span data-testid="delivery-delta">Δ {delta > 0 ? `+${delta}` : delta === 0 ? "0" : delta}</span>
      </div>
    </div>
  );
}
