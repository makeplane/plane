/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TDeliveryTrendData, TDeliveryTrendPoint } from "@plane/types";
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

export function DeliveryPanel({ data, isLoading, error }: Props): React.ReactElement {
  return (
    <PanelSurface
      title="Created vs completed"
      subtitle="Two independent date bases; reopened items are not counted as completed here."
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
  const maxY = Math.max(1, ...series_created.map((p) => p.count), ...series_completed.map((p) => p.count));
  const width = 100;
  const height = 60;

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[160px] w-full"
        role="img"
        aria-label={`Created ${created_total}, completed ${completed_total}`}
        data-testid="delivery-chart"
      >
        <Series points={series_created} color={COLORS.created} maxY={maxY} width={width} height={height} />
        <Series points={series_completed} color={COLORS.completed} maxY={maxY} width={width} height={height} />
      </svg>

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

interface SeriesProps {
  points: TDeliveryTrendPoint[];
  color: string;
  maxY: number;
  width: number;
  height: number;
}

function Series({ points, color, maxY, width, height }: SeriesProps): React.ReactElement {
  if (points.length === 0) return <polyline points="" fill="none" stroke={color} strokeWidth="1" />;
  const stepX = points.length > 1 ? width / (points.length - 1) : width / 2;
  const path = points
    .map((point, index) => {
      const x = index * stepX;
      const y = height - (point.count / maxY) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return <path d={path} fill="none" stroke={color} strokeWidth="1.5" />;
}
