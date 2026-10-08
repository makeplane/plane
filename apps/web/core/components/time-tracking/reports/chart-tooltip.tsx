/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

type Props = {
  active?: boolean;
  title: string;
  rows: { label: string; value: string; color: string }[];
};

/** Hover tooltip for the time charts: the color swatch carries identity, text stays in text colors. */
export function ChartTooltipContent({ active, title, rows }: Props) {
  if (!active || rows.length === 0) return null;
  return (
    <div className="flex min-w-40 flex-col gap-1 rounded-md border-[0.5px] border-strong bg-surface-1 px-3 py-2 text-11 shadow-raised-200">
      <span className="font-medium text-primary">{title}</span>
      {rows.map((row) => (
        <span key={row.label} className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5 text-secondary">
            <span className="size-2 flex-shrink-0 rounded-sm" style={{ backgroundColor: row.color }} />
            <span className="truncate">{row.label}</span>
          </span>
          <span className="text-primary tabular-nums">{row.value}</span>
        </span>
      ))}
    </div>
  );
}

/** Legend labels stay in text ink; the swatch beside them carries the series color. */
export const legendText = (value: string) => <span className="text-secondary">{value}</span>;
