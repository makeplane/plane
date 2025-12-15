import { startOfToday, format } from "date-fns";
import { isEmpty, orderBy, sortBy, uniqBy } from "lodash-es";
// plane imports
import type { ICycle, TCycleFilters, TProgressSnapshot } from "@plane/types";
// local imports
import { findTotalDaysInRange, generateDateArray, getDate } from "./datetime";
import { satisfiesDateFilter } from "./filter";

/**
 * Orders cycles based on their status
 * @param {ICycle[]} cycles - Array of cycles to be ordered
 * @param {boolean} sortByManual - Whether to sort by manual order
 * @returns {ICycle[]} Ordered array of cycles
 */
export const orderCycles = (cycles: ICycle[], sortByManual: boolean): ICycle[] => {
  if (cycles.length === 0) return [];

  const acceptedStatuses = ["current", "upcoming", "draft"];
  const STATUS_ORDER: {
    [key: string]: number;
  } = {
    current: 1,
    upcoming: 2,
    draft: 3,
  };

  let filteredCycles = cycles.filter((c) => acceptedStatuses.includes(c.status?.toLowerCase() ?? ""));
  if (sortByManual) filteredCycles = sortBy(filteredCycles, [(c) => c.sort_order]);
  else
    filteredCycles = sortBy(filteredCycles, [
      (c) => STATUS_ORDER[c.status?.toLowerCase() ?? ""],
      (c) => (c.status?.toLowerCase() === "upcoming" ? c.start_date : c.name.toLowerCase()),
    ]);

  return filteredCycles;
};

/**
 * Filters cycles based on provided filter criteria
 * @param {ICycle} cycle - The cycle to be filtered
 * @param {TCycleFilters} filter - Filter criteria to apply
 * @returns {boolean} Whether the cycle passes the filter
 */
export const shouldFilterCycle = (cycle: ICycle, filter: TCycleFilters): boolean => {
  let fallsInFilters = true;
  Object.keys(filter).forEach((key) => {
    const filterKey = key as keyof TCycleFilters;
    if (filterKey === "status" && filter.status && filter.status.length > 0)
      fallsInFilters = fallsInFilters && filter.status.includes(cycle.status?.toLowerCase() ?? "");
    if (filterKey === "start_date" && filter.start_date && filter.start_date.length > 0) {
      const startDate = getDate(cycle.start_date);
      filter.start_date.forEach((dateFilter) => {
        fallsInFilters = fallsInFilters && !!startDate && satisfiesDateFilter(startDate, dateFilter);
      });
    }
    if (filterKey === "end_date" && filter.end_date && filter.end_date.length > 0) {
      const endDate = getDate(cycle.end_date);
      filter.end_date.forEach((dateFilter) => {
        fallsInFilters = fallsInFilters && !!endDate && satisfiesDateFilter(endDate, dateFilter);
      });
    }
  });

  return fallsInFilters;
};

/**
 * Calculates the scope based on whether it's an issue or estimate points
 * @param {any} p - Progress data
 * @param {boolean} isTypeIssue - Whether the type is an issue
 * @returns {number} Calculated scope
 */
const scope = (p: any, isTypeIssue: boolean) => (isTypeIssue ? p.total_issues : p.total_estimate_points);

/**
 * Calculates the ideal progress value
 * @param {string} date - Current date
 * @param {number} scope - Total scope
 * @param {ICycle} cycle - Cycle data
 * @returns {number} Ideal progress value
 */
const ideal = (date: string, scope: number, cycle: ICycle) =>
  Math.floor(
    ((findTotalDaysInRange(date, cycle.end_date) || 0) /
      (findTotalDaysInRange(cycle.start_date, cycle.end_date) || 0)) *
      scope
  );

/**
 * Formats cycle data for version 1
 * @param {boolean} isTypeIssue - Whether the type is an issue
 * @param {ICycle} cycle - Cycle data
 * @param {boolean} isBurnDown - Whether it's a burn down chart
 * @param {Date|string} endDate - End date
 * @returns {TProgressChartData} Formatted progress data
 */
const formatV1Data = (isTypeIssue: boolean, cycle: ICycle, isBurnDown: boolean, endDate: Date | string) => {
  const today = format(startOfToday(), "yyyy-MM-dd");
  const data = isTypeIssue ? cycle.distribution : cycle.estimate_distribution;
  const extendedArray = generateDateArray(endDate, endDate).map((d) => d.date);

  if (isEmpty(data)) return [];
  const progress = [...Object.keys(data.completion_chart), ...extendedArray].map((p) => {
    const pending = data.completion_chart[p] || 0;
    const total = isTypeIssue ? cycle.total_issues : cycle.total_estimate_points;
    const completed = scope(cycle, isTypeIssue) - pending;

    return {
      date: p,
      scope: p < today ? scope(cycle, isTypeIssue) : null,
      completed,
      backlog: isTypeIssue ? cycle.backlog_issues : cycle.backlog_estimate_points,
      started: p === today ? cycle[isTypeIssue ? "started_issues" : "started_estimate_points"] : undefined,
      unstarted: p === today ? cycle[isTypeIssue ? "unstarted_issues" : "unstarted_estimate_points"] : undefined,
      cancelled: p === today ? cycle[isTypeIssue ? "cancelled_issues" : "cancelled_estimate_points"] : undefined,
      pending: Math.abs(pending || 0),
      ideal: p < today ? ideal(p, total || 0, cycle) : p <= cycle.end_date! ? ideal(today, total || 0, cycle) : null,
      actual: p <= today ? (isBurnDown ? Math.abs(pending) : completed) : undefined,
    };
  });

  return progress;
};

/**
 * Formats cycle data for version 2
 * @param {boolean} isTypeIssue - Whether the type is an issue
 * @param {ICycle} cycle - Cycle data
 * @param {boolean} isBurnDown - Whether it's a burn down chart
 * @param {Date|string} endDate - End date
 * @returns {TProgressChartData} Formatted progress data
 */
const formatV2Data = (isTypeIssue: boolean, cycle: ICycle, isBurnDown: boolean, endDate: Date | string) => {
  if (!cycle.progress) return [];
  let today: Date | string = startOfToday();

  const extendedArray = endDate > today ? generateDateArray(today, endDate) : [];
  if (isEmpty(cycle.progress)) return extendedArray;
  today = format(startOfToday(), "yyyy-MM-dd");
  const todaysData = cycle?.progress[cycle?.progress.length - 1];
  const scopeToday = scope(todaysData, isTypeIssue);
  const idealToday = ideal(todaysData.date, scopeToday, cycle);

  let progress = [...orderBy(cycle?.progress, "date"), ...extendedArray].map((p) => {
    const pending = isTypeIssue
      ? p.total_issues - p.completed_issues - p.cancelled_issues
      : p.total_estimate_points - p.completed_estimate_points - p.cancelled_estimate_points;
    const completed = isTypeIssue ? p.completed_issues : p.completed_estimate_points;
    const dataDate = p.progress_date ? format(new Date(p.progress_date), "yyyy-MM-dd") : p.date;

    return {
      date: dataDate,
      scope: dataDate! < today ? scope(p, isTypeIssue) : dataDate! <= cycle.end_date! ? scopeToday : null,
      completed,
      backlog: isTypeIssue ? p.backlog_issues : p.backlog_estimate_points,
      started: isTypeIssue ? p.started_issues : p.started_estimate_points,
      unstarted: isTypeIssue ? p.unstarted_issues : p.unstarted_estimate_points,
      cancelled: isTypeIssue ? p.cancelled_issues : p.cancelled_estimate_points,
      pending: Math.abs(pending),
      ideal:
        dataDate! < today
          ? ideal(dataDate, scope(p, isTypeIssue), cycle)
          : dataDate! < cycle.end_date!
            ? idealToday
            : null,
      actual: dataDate! <= today ? (isBurnDown ? Math.abs(pending) : completed) : undefined,
    };
  });
  progress = uniqBy(progress, "date");

  return progress;
};

export const formatActiveCycle = (args: {
  cycle: ICycle;
  isBurnDown?: boolean | undefined;
  isTypeIssue?: boolean | undefined;
}) => {
  const { cycle, isBurnDown, isTypeIssue } = args;
  const endDate: Date | string = new Date(cycle.end_date!);

  return cycle.version === 1
    ? formatV1Data(isTypeIssue!, cycle, isBurnDown!, endDate)
    : formatV2Data(isTypeIssue!, cycle, isBurnDown!, endDate);
};

/**
 * Calculates cycle progress percentage excluding cancelled issues from total count
 * Formula: completed / (total - cancelled) * 100
 * This gives accurate progress based on: pendingIssues = totalIssues - completedIssues - cancelledIssues
 * @param cycle - Cycle data object
 * @param estimateType - Whether to calculate based on "issues" or "points"
 * @param includeInProgress - Whether to include started/in-progress items in completion calculation
 * @returns Progress percentage (0-100)
 */
export const calculateCycleProgress = (
  cycle: ICycle | undefined,
  estimateType: "issues" | "points" = "issues",
  includeInProgress: boolean = false
): number => {
  if (!cycle) return 0;

  const progressSnapshot: TProgressSnapshot | undefined = cycle.progress_snapshot;
  const cycleDetails = progressSnapshot && !isEmpty(progressSnapshot) ? progressSnapshot : cycle;

  let completed: number;
  let cancelled: number;
  let total: number;

  if (estimateType === "points") {
    completed = cycleDetails.completed_estimate_points || 0;
    cancelled = cycleDetails.cancelled_estimate_points || 0;
    total = cycleDetails.total_estimate_points || 0;

    if (includeInProgress) {
      completed += cycleDetails.started_estimate_points || 0;
    }
  } else {
    completed = cycleDetails.completed_issues || 0;
    cancelled = cycleDetails.cancelled_issues || 0;
    total = cycleDetails.total_issues || 0;

    if (includeInProgress) {
      completed += cycleDetails.started_issues || 0;
    }
  }

  // Exclude cancelled issues from total (pendingIssues = total - completed - cancelled)
  const adjustedTotal = total - cancelled;

  // Handle edge cases
  if (adjustedTotal === 0) return 0;
  if (completed < 0 || adjustedTotal < 0) return 0;
  if (completed > adjustedTotal) return 100;

  // Calculate percentage and round
  const percentage = (completed / adjustedTotal) * 100;
  return Math.round(percentage);
};
