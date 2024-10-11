import { format, startOfToday } from "date-fns";
import { isEmpty, orderBy, uniqBy } from "lodash";
import { ICycle } from "@plane/types";
import { findTotalDaysInRange, generateDateArray } from "@/helpers/date-time.helper";

const scope = (p: any, isTypeIssue: boolean) => (isTypeIssue ? p.total_issues : p.total_estimate_points);
const ideal = (date: string, scope: number, cycle: ICycle) => {
  const totalDays = findTotalDaysInRange(cycle.start_date, cycle.end_date) || 0;
  const currentDayIndex = totalDays - (findTotalDaysInRange(date, cycle.end_date) || 0);
  return (currentDayIndex / (totalDays - 1)) * scope;
};

const formatV1Data = (isTypeIssue: boolean, cycle: ICycle, isBurnDown: boolean, endDate: Date | string) => {
  const today = format(startOfToday(), "yyyy-MM-dd");
  const data = isTypeIssue ? cycle.distribution : cycle.estimate_distribution;
  const extendedArray = generateDateArray(endDate, endDate).map((d) => d.date);

  if (isEmpty(data?.completion_chart)) return generateDateArray(new Date(cycle.start_date!), endDate);
  let progress = [...Object.keys(data.completion_chart), ...extendedArray].map((p) => {
    const pending = data.completion_chart[p] || 0;
    const total = (isTypeIssue ? cycle.total_issues : cycle.total_estimate_points) || 0;
    const completed = total - pending;
    const idealDone = ideal(p, total, cycle);
    return {
      date: p,
      scope: p! <= format(endDate as Date, "yyyy-MM-dd") ? total : null,
      completed,
      backlog: isTypeIssue ? cycle.backlog_issues : cycle.backlog_estimate_points,
      started: p === today ? cycle[isTypeIssue ? "started_issues" : "started_estimate_points"] : undefined,
      unstarted: p === today ? cycle[isTypeIssue ? "unstarted_issues" : "unstarted_estimate_points"] : undefined,
      cancelled: p === today ? cycle[isTypeIssue ? "cancelled_issues" : "cancelled_estimate_points"] : undefined,
      pending: Math.abs(pending || 0),
      ideal: p! <= cycle.end_date! ? (isBurnDown ? total - idealDone : idealDone) : null,
      actual: p <= today ? (isBurnDown ? Math.abs(pending) : completed) : undefined,
    };
  });

  progress = uniqBy(orderBy(progress, "date"), "date");
  return progress;
};

const formatV2Data = (isTypeIssue: boolean, cycle: ICycle, isBurnDown: boolean, endDate: Date | string) => {
  let today: Date | string = startOfToday();
  const extendedArray =
    endDate > today ? generateDateArray(today as Date, endDate).filter((d) => d.date >= cycle.start_date!) : [];
  if (isEmpty(cycle.progress)) return generateDateArray(new Date(cycle.start_date!), endDate);
  today = format(startOfToday(), "yyyy-MM-dd");
  const todaysData = cycle?.progress[cycle?.progress.length - 1];
  const scopeToday = scope(todaysData, isTypeIssue);

  let progress = [...orderBy(cycle?.progress, "date"), ...extendedArray].map((p) => {
    const pending = isTypeIssue
      ? p.total_issues - p.completed_issues - p.cancelled_issues
      : p.total_estimate_points - p.completed_estimate_points - p.cancelled_estimate_points;
    const completed = isTypeIssue ? p.completed_issues : p.completed_estimate_points;
    const dataDate = p.progress_date ? format(new Date(p.progress_date), "yyyy-MM-dd") : p.date;
    const computedScope = dataDate! <= today ? scope(p, isTypeIssue) : dataDate! <= cycle.end_date! ? scopeToday : null;
    const idealDone = ideal(dataDate, dataDate < today ? scope(p, isTypeIssue) : scopeToday, cycle);

    return {
      date: dataDate,
      scope: computedScope,
      completed,
      backlog: isTypeIssue ? p.backlog_issues : p.backlog_estimate_points,
      started: isTypeIssue ? p.started_issues : p.started_estimate_points,
      unstarted: isTypeIssue ? p.unstarted_issues : p.unstarted_estimate_points,
      cancelled: isTypeIssue ? p.cancelled_issues : p.cancelled_estimate_points,
      pending: Math.abs(pending),
      ideal: dataDate! <= cycle.end_date! ? (isBurnDown ? computedScope - idealDone : idealDone) : null,
      actual: dataDate! <= today ? (isBurnDown ? Math.abs(pending) : completed) : undefined,
    };
  });
  progress = uniqBy(orderBy(progress, "date"), "date");

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
