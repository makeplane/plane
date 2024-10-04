import { startOfToday, format } from "date-fns";
import { isEmpty, orderBy, uniqBy } from "lodash";
import sortBy from "lodash/sortBy";
import { ICycle, TCycleFilters } from "@plane/types";
// helpers
import { findTotalDaysInRange, generateDateArray, getDate } from "@/helpers/date-time.helper";
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

const scope = (p: any, isTypeIssue: boolean) => (isTypeIssue ? p.total_issues : p.total_estimate_points);
const ideal = (date: string, scope: number, cycle: ICycle) =>
  Math.floor(
    ((findTotalDaysInRange(date, cycle.end_date) || 0) /
      (findTotalDaysInRange(cycle.start_date, cycle.end_date) || 0)) *
      scope
  );

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
      scope: p! < today ? scope(cycle, isTypeIssue) : null,
      completed,
      backlog: isTypeIssue ? cycle.backlog_issues : cycle.backlog_estimate_points,
      started: p === today ? cycle[isTypeIssue ? "started_issues" : "started_estimate_points"] : undefined,
      unstarted: p === today ? cycle[isTypeIssue ? "unstarted_issues" : "unstarted_estimate_points"] : undefined,
      cancelled: p === today ? cycle[isTypeIssue ? "cancelled_issues" : "cancelled_estimate_points"] : undefined,
      pending: Math.abs(pending || 0),
      ideal:
        p < today
          ? ideal(p, total || 0, cycle)
          : p <= cycle.end_date!
            ? ideal(today as string, total || 0, cycle)
            : null,
      actual: p <= today ? (isBurnDown ? Math.abs(pending) : completed) : undefined,
    };
  });

  return progress;
};

const formatV2Data = (isTypeIssue: boolean, cycle: ICycle, isBurnDown: boolean, endDate: Date | string) => {
  if (!cycle.progress) return [];
  let today: Date | string = startOfToday();

  const extendedArray = endDate > today ? generateDateArray(today as Date, endDate) : [];
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
