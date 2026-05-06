/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { YearStats } from "./calendar-stats-helper";

const formatDelta = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `${n}` : "±0");

type Props = { year: number; stats: YearStats };

export const YearStatsCard = ({ year, stats }: Props) => (
  <div className="bg-surface-1 border border-subtle rounded-lg p-4">
    <p className="text-body-sm-semibold text-primary mb-3">{year} summary</p>
    <div className="grid grid-cols-4 gap-4">
      <div>
        <div className="text-h4-semibold text-primary">{stats.workingDays}</div>
        <div className="text-caption-sm-regular text-secondary">Working</div>
      </div>
      <div>
        <div className="text-h4-semibold text-primary">{stats.holidayCount}</div>
        <div className="text-caption-sm-regular text-secondary">Holidays</div>
      </div>
      <div>
        <div className="text-h4-semibold text-primary">{stats.weekendCount}</div>
        <div className="text-caption-sm-regular text-secondary">Weekends</div>
      </div>
      <div>
        <div className="text-h4-semibold text-primary">{formatDelta(stats.overrideDelta)}</div>
        <div className="text-caption-sm-regular text-secondary">Overrides</div>
      </div>
    </div>
  </div>
);
