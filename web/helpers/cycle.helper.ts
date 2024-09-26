import { isEmpty, orderBy, uniqBy } from "lodash";
import sortBy from "lodash/sortBy";
import { ICycle, TCycleFilters } from "@plane/types";
// helpers
import { generateDateArray, getDate, getToday } from "@/helpers/date-time.helper";
import { satisfiesDateFilter } from "@/helpers/filter.helper";

export type TProgressChartData = {
  date: string;
  scope: number;
  completed: number;
  backlog: number;
  started: number;
  unstarted: number;
  cancelled: number;
  pending: number;
  ideal: number;
  actual: number;
}[];

/**
 * @description orders cycles based on their status
 * @param {ICycle[]} cycles
 * @returns {ICycle[]}
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
 * @description filters cycles based on the filter
 * @param {ICycle} cycle
 * @param {TCycleFilters} filter
 * @returns {boolean}
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

export const formatActiveCycle = (args: {
  cycle: ICycle;
  isBurnDown?: boolean | undefined;
  isTypeIssue?: boolean | undefined;
}) => {
  const { cycle, isBurnDown, isTypeIssue } = args;
  let today = getToday();
  const endDate: Date | string = new Date(cycle.end_date!);

  const extendedArray = endDate > today ? generateDateArray(today as Date, endDate) : [];
  if (isEmpty(cycle.progress)) return extendedArray;
  today = getToday(true);

  const scope = (p: any) => (isTypeIssue ? p.total_issues : p.total_estimate_points);
  const ideal = (p: any) =>
    isTypeIssue
      ? Math.abs(p.total_issues - p.completed_issues + (Math.random() < 0.5 ? -1 : 1))
      : Math.abs(p.total_estimate_points - p.completed_estimate_points + (Math.random() < 0.5 ? -1 : 1));

  const scopeToday = scope(cycle?.progress[cycle?.progress.length - 1]);
  const idealToday = ideal(cycle?.progress[cycle?.progress.length - 1]);

  const progress = [...orderBy(cycle?.progress, "date"), ...extendedArray].map((p) => {
    const pending = isTypeIssue
      ? p.total_issues - p.completed_issues - p.cancelled_issues
      : p.total_estimate_points - p.completed_estimate_points - p.cancelled_estimate_points;
    const completed = isTypeIssue ? p.completed_issues : p.completed_estimate_points;

    return {
      date: p.date,
      scope: p.date! < today ? scope(p) : p.date! < cycle.end_date! ? scopeToday : null,
      completed,
      backlog: isTypeIssue ? p.backlog_issues : p.backlog_estimate_points,
      started: isTypeIssue ? p.started_issues : p.started_estimate_points,
      unstarted: isTypeIssue ? p.unstarted_issues : p.unstarted_estimate_points,
      cancelled: isTypeIssue ? p.cancelled_issues : p.cancelled_estimate_points,
      pending: Math.abs(pending),
      // TODO: This is a temporary logic to show the ideal line in the cycle chart
      ideal: p.date! < today ? ideal(p) : p.date! < cycle.end_date! ? idealToday : null,
      actual: p.date! <= today ? (isBurnDown ? Math.abs(pending) : completed) : undefined,
    };
  });
  return uniqBy(progress, "date");
};
