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
  <div className="flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-2">
      <label htmlFor="date-from" className="text-12 font-medium text-tertiary">
        From
      </label>
      <input
        id="date-from"
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        className="focus:ring-accent-primary rounded border border-subtle bg-surface-1 px-2 py-1.5 text-12 text-primary focus:ring-1 focus:outline-none"
      />
    </div>
    <div className="flex items-center gap-2">
      <label htmlFor="date-to" className="text-12 font-medium text-tertiary">
        To
      </label>
      <input
        id="date-to"
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        className="focus:ring-accent-primary rounded border border-subtle bg-surface-1 px-2 py-1.5 text-12 text-primary focus:ring-1 focus:outline-none"
      />
    </div>
    <button
      onClick={onApply}
      type="button"
      className="rounded bg-accent-primary px-3 py-1.5 text-12 font-medium text-white transition-colors hover:bg-accent-primary/90"
    >
      Apply
    </button>
  </div>
);
