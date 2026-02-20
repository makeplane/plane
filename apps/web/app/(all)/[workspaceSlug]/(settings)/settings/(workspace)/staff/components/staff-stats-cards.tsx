/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

interface StaffStats {
  total: number;
  active: number;
  probation: number;
  resigned: number;
  suspended: number;
}

interface StaffStatsCardsProps {
  stats: StaffStats;
}

/** Summary stat cards shown at top of Staff settings page. */
export const StaffStatsCards = ({ stats }: StaffStatsCardsProps) => (
  <div className="grid grid-cols-5 gap-4">
    <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
      <p className="text-xs text-custom-text-400">Total Staff</p>
      <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
    </div>
    <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
      <p className="text-xs text-custom-text-400">Active</p>
      <p className="mt-1 text-2xl font-semibold text-green-600">{stats.active}</p>
    </div>
    <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
      <p className="text-xs text-custom-text-400">Probation</p>
      <p className="mt-1 text-2xl font-semibold text-yellow-600">{stats.probation}</p>
    </div>
    <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
      <p className="text-xs text-custom-text-400">Resigned</p>
      <p className="mt-1 text-2xl font-semibold text-color-secondary">{stats.resigned}</p>
    </div>
    <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
      <p className="text-xs text-custom-text-400">Suspended</p>
      <p className="mt-1 text-2xl font-semibold text-red-600">{stats.suspended}</p>
    </div>
  </div>
);
