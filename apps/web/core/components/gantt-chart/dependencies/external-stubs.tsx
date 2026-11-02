/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { TResolvedExternalLink } from "./external-links";
import { isDependencyViolated } from "./dependency-utils";

type Row = {
  y: number;
  block: {
    position?: { marginLeft: number; width: number } | null;
    start_date?: string | null;
    target_date?: string | null;
  };
};

type Props = {
  links: TResolvedExternalLink[];
  rows: Map<string, Row>;
  normalMarkerId: string;
  violatedMarkerId: string;
};

export const ExternalStubs = observer(function ExternalStubs({ links, rows, normalMarkerId, violatedMarkerId }: Props) {
  // One stub per bar and side: several external links share it and join their codes in one label.
  const groups = new Map<string, TResolvedExternalLink[]>();
  for (const link of links) {
    const key = `${link.localId}|${link.direction}`;
    groups.set(key, [...(groups.get(key) ?? []), link]);
  }
  return [...groups.values()].map((group) => {
    const link = group[0];
    const row = rows.get(link.localId);
    if (!row?.block.position) return null;
    const successor = link.direction === "succ";
    const edge = row.block.position.marginLeft + (successor ? row.block.position.width : 0);
    const from = successor ? edge : edge - 28;
    const to = successor ? edge + 28 : edge;
    const violatedAny = group.some((item) =>
      successor
        ? isDependencyViolated(row.block.target_date, item.startDate)
        : isDependencyViolated(item.targetDate, row.block.start_date)
    );
    const label = group.map((item) => item.code ?? "dự án khác").join(" · ");
    const tooltip = group.map((item) => `${item.code ?? "dự án khác"} ${item.name ?? ""}`).join(", ");
    return (
      <g key={`${link.localId}-${link.direction}`}>
        <path
          d={`M ${from} ${row.y} H ${to}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={violatedAny ? 2 : 1.5}
          strokeDasharray="5 4"
          className={violatedAny ? "text-danger-primary dark:text-[oklch(0.65_0.24_25)]" : "text-tertiary"}
          markerEnd={`url(#${violatedAny ? violatedMarkerId : normalMarkerId})`}
          pointerEvents="none"
        />
        <text
          x={successor ? to + 4 : from - 4}
          y={row.y - 5}
          textAnchor={successor ? "start" : "end"}
          className="fill-current text-10 text-tertiary"
          style={{ pointerEvents: "auto" }}
        >
          <title>{tooltip}</title>
          {label}
        </text>
      </g>
    );
  });
});
