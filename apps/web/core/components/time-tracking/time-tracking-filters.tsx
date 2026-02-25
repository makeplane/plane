/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Date range filter bar for the time tracking report page.
 */

import type { FC } from "react";

type TTimeTrackingFiltersProps = {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onApply: () => void;
};

export const TimeTrackingFilters: FC<TTimeTrackingFiltersProps> = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
}) => (
  <div className="flex items-center gap-3 flex-wrap">
    <div className="flex items-center gap-2">
      <label htmlFor="date-from" className="text-xs font-medium text-tertiary">
        From
      </label>
      <input
        id="date-from"
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        className="text-xs border border-subtle rounded px-2 py-1.5 bg-surface-1 text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
      />
    </div>
    <div className="flex items-center gap-2">
      <label htmlFor="date-to" className="text-xs font-medium text-tertiary">
        To
      </label>
      <input
        id="date-to"
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        className="text-xs border border-subtle rounded px-2 py-1.5 bg-surface-1 text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
      />
    </div>
    <button
      onClick={onApply}
      type="button"
      className="text-xs font-medium px-3 py-1.5 rounded bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
    >
      Apply
    </button>
  </div>
);
