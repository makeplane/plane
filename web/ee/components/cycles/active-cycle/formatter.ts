import { format, startOfToday } from "date-fns";
import { isEmpty, orderBy, uniqBy } from "lodash";
import { ICycle } from "@plane/types";
import { findTotalDaysInRange, generateDateArray  } from "@plane/utils";

const scope = (p: any, isTypeIssue: boolean) => (isTypeIssue ? p.total_issues : p.total_estimate_points);
const ideal = (date: string, scope: number, cycle: ICycle) => {
  const totalDays = findTotalDaysInRange(cycle.start_date, cycle.end_date) || 0;
  const currentDayIndex = totalDays - (findTotalDaysInRange(date, cycle.end_date) || 0);
  return (currentDayIndex / (totalDays - 1)) * scope;
};

const formatV1Data = (isTypeIssue: boolean, cycle: ICycle, isBurnDown: boolean, endDate: Date | string) => {
  const today = format(startOfToday(), "yyyy-MM-dd");
  const data = isTypeIssue ? cycle.distribution : cycle.estimate_distribution;
  const extendedArray = generateDateArray(endDate, endDate)
    .filter((d) => d.date >= cycle.start_date! && d.date <= cycle.end_date!)
    .map((d) => d.date);
  if (!data?.completion_chart) return null;
  if (isEmpty(data?.completion_chart)) return generateDateArray(new Date(cycle.start_date!), endDate);
  let progress = [...Object.keys(data.completion_chart), ...extendedArray].map((p) => {
    const pending = data.completion_chart[p] || 0;
    const total = (isTypeIssue ? cycle.total_issues : cycle.total_estimate_points) || 0;
    const completed = total - pending;
    const idealDone = ideal(p, total, cycle) || 0;

    return {
      date: p,
      scope: p! <= cycle.end_date! ? total : null,
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
    endDate > today
      ? generateDateArray(today as Date, endDate).filter(
          (d) => d.date >= cycle.start_date! && d.date <= cycle.end_date!
        )
      : [];
  if (!cycle?.progress) return null;
  if (isEmpty(cycle.progress)) return generateDateArray(new Date(cycle.start_date!), endDate);
  const startDate = cycle.start_date && format(new Date(cycle.start_date), "yyyy-MM-dd");
  const todaysData = cycle?.progress[cycle?.progress.length - 1];
  const scopeToday = scope(todaysData, isTypeIssue);
  today = format(today, "yyyy-MM-dd");
  let progress = [...orderBy(cycle?.progress, "date"), ...extendedArray];
  if (startDate && today === startDate) {
    const prevDay = new Date(today);
    prevDay.setDate(prevDay.getDate() - 1);
    progress = [
      {
        progress_date: prevDay,
        started_issues: 0,
        started_estimate_points: 0,
        backlog_issues: 0,
        backlog_estimate_points: 0,
        unstarted_issues: 0,
        unstarted_estimate_points: 0,
        total_issues: cycle.total_issues,
        total_points: progress[0].total_points,
        completed_issues: 0,
        completed_points: 0,
        cancelled_issues: 0,
        cancelled_points: 0,
      },
      ...progress,
    ];
  }
  progress = progress.map((p) => {
    const pending = isTypeIssue
      ? p.total_issues - p.completed_issues - p.cancelled_issues
      : p.total_estimate_points - p.completed_estimate_points - p.cancelled_estimate_points;
    const completed = isTypeIssue ? p.completed_issues : p.completed_estimate_points;
    const dataDate = p.progress_date ? format(new Date(p.progress_date), "yyyy-MM-dd") : p.date;
    const computedScope = dataDate! <= today ? scope(p, isTypeIssue) : dataDate! <= cycle.end_date! ? scopeToday : null;
    let idealDone = ideal(dataDate, dataDate < today ? scope(p, isTypeIssue) : scopeToday, cycle);
    idealDone = Math.max(idealDone, 0);
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
