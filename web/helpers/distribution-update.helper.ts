import { format } from "date-fns";
import get from "lodash/get";
import set from "lodash/set";
// types
import { ICycle, IEstimatePoint, IModule, IState, TIssue } from "@plane/types";
// constants
import { STATE_GROUPS, COMPLETED_STATE_GROUPS } from "@/constants/state";
// helper
import { getDate } from "./date-time.helper";

export type DistributionObjectUpdate = {
  id: string;
  completed_issues?: number;
  pending_issues?: number;
  total_issues: number;
  completed_estimates?: number;
  pending_estimates?: number;
  total_estimates: number;
};

type ChartUpdates = {
  updates: {
    path: string[];
    value: number;
  }[];
  isCompleted?: boolean;
};

export type DistributionUpdates = {
  pathUpdates: { path: string[]; value: number }[];
  assigneeUpdates: DistributionObjectUpdate[];
  labelUpdates: DistributionObjectUpdate[];
};

const STATE_DISTRIBUTION = {
  [STATE_GROUPS.backlog.key]: {
    key: STATE_GROUPS.backlog.key,
    issues: "backlog_issues",
    points: "backlog_estimate_points",
  },
  [STATE_GROUPS.unstarted.key]: {
    key: STATE_GROUPS.unstarted.key,
    issues: "unstarted_issues",
    points: "unstarted_estimate_points",
  },
  [STATE_GROUPS.started.key]: {
    key: STATE_GROUPS.started.key,
    issues: "started_issues",
    points: "started_estimate_points",
  },
  [STATE_GROUPS.completed.key]: {
    key: STATE_GROUPS.completed.key,
    issues: "completed_issues",
    points: "completed_estimate_points",
  },
  [STATE_GROUPS.cancelled.key]: {
    key: STATE_GROUPS.cancelled.key,
    issues: "cancelled_issues",
    points: "cancelled_estimate_points",
  },
};

/**
 * Get Distribution updates with the help of previous and next issue states
 * @param prevIssueState
 * @param nextIssueState
 * @param stateMap
 * @param estimatePointById
 * @returns
 */
export const getDistributionPathsPostUpdate = (
  prevIssueState: TIssue | undefined,
  nextIssueState: TIssue | undefined,
  stateMap: Record<string, IState>,
  estimatePointById?: (estimatePointId: string) => IEstimatePoint | undefined
): DistributionUpdates => {
  const prevIssueDistribution = getDistributionDataOfIssue(prevIssueState, -1, stateMap, estimatePointById);
  const nextIssueDistribution = getDistributionDataOfIssue(nextIssueState, 1, stateMap, estimatePointById);

  const prevChartDistribution = prevIssueDistribution.chartUpdates;
  const nextChartDistribution = nextIssueDistribution.chartUpdates;

  let chartUpdates: {
    path: string[];
    value: number;
  }[];

  // if the completed status of chart updates are same the get chart updates from both the issue states
  if (prevChartDistribution.isCompleted === nextChartDistribution.isCompleted) {
    chartUpdates = [...prevChartDistribution.updates, ...nextChartDistribution.updates];
  } // if not the get chart updates from only the next update
  else {
    chartUpdates = [...nextChartDistribution.updates];
  }

  // merge the updates from both issue states into a single object
  return {
    pathUpdates: [...prevIssueDistribution.pathUpdates, ...nextIssueDistribution.pathUpdates, ...chartUpdates],
    assigneeUpdates: [...prevIssueDistribution.assigneeUpdates, ...nextIssueDistribution.assigneeUpdates],
    labelUpdates: [...prevIssueDistribution.labelUpdates, ...nextIssueDistribution.labelUpdates],
  };
};

/**
 * Get Distribution update for a single issue state
 * @param issue
 * @param multiplier
 * @param stateMap
 * @param estimatePointById
 * @returns
 */
const getDistributionDataOfIssue = (
  issue: TIssue | undefined,
  multiplier: -1 | 1,
  stateMap: Record<string, IState>,
  estimatePointById?: (estimatePointId: string) => IEstimatePoint | undefined
): DistributionUpdates & { chartUpdates: ChartUpdates } => {
  const pathUpdates: { path: string[]; value: number }[] = [];

  // If issue does not exist, send a default object
  if (!issue) return { pathUpdates, assigneeUpdates: [], labelUpdates: [], chartUpdates: { updates: [] } };

  const state = stateMap[issue.state_id ?? ""];
  const stateGroup = state.group;

  // get if the state is in completed state
  const isCompleted = COMPLETED_STATE_GROUPS.indexOf(stateGroup) > -1;
  // get estimate point in number for the issue
  const estimatePoint = parseFloat(estimatePointById?.(issue.estimate_point ?? "")?.value ?? "0");

  // add all the path updates that can be updated directly on the distribution object
  pathUpdates.push({ path: ["total_issues"], value: multiplier });
  pathUpdates.push({ path: ["total_estimate_points"], value: multiplier * estimatePoint });

  // path updates for state distributions
  const stateDistribution = STATE_DISTRIBUTION[stateGroup];

  pathUpdates.push({ path: [stateDistribution.issues], value: multiplier });
  pathUpdates.push({ path: [stateDistribution.points], value: multiplier * estimatePoint });

  // get assignee and label distribution updates
  const assigneeUpdates = getObjectDistributionArray(issue.assignee_ids, isCompleted, estimatePoint, multiplier);
  const labelUpdates = getObjectDistributionArray(issue.label_ids, isCompleted, estimatePoint, multiplier);

  // chart updates based on date of completed or not completed
  const chartUpdates = getChartUpdates(isCompleted, issue.completed_at, estimatePoint, multiplier);
  return {
    pathUpdates,
    assigneeUpdates,
    labelUpdates,
    chartUpdates,
  };
};

/**
 * This is to get distribution update array for either assignees and labels object
 * @param ids the assignee or label ids of issue
 * @param isCompleted
 * @param estimatePoint
 * @param multiplier
 * @returns
 */
const getObjectDistributionArray = (ids: string[], isCompleted: boolean, estimatePoint: number, multiplier: -1 | 1) => {
  const objectDistributionArray: DistributionObjectUpdate[] = [];

  // iterate over each id
  for (const id of ids) {
    const objectDistribution: DistributionObjectUpdate = {
      id,
      total_issues: multiplier,
      total_estimates: estimatePoint * multiplier,
    };

    // update paths for issue counts and estimate counts
    if (isCompleted) {
      objectDistribution["completed_issues"] = multiplier;
      objectDistribution["completed_estimates"] = estimatePoint * multiplier;
    } else {
      objectDistribution["pending_issues"] = multiplier;
      objectDistribution["pending_estimates"] = estimatePoint * multiplier;
    }

    objectDistributionArray.push(objectDistribution);
  }

  return objectDistributionArray;
};

/**
 * get chart distribution based of completed or not completed states
 * @param isCompleted
 * @param completedAt
 * @param estimatePoint
 * @param multiplier
 * @returns
 */
const getChartUpdates = (
  isCompleted: boolean,
  completedAt: string | null,
  estimatePoint: number,
  multiplier: -1 | 1
) => {
  // if completed At date does not exist use current date
  let dateToUpdate = format(new Date(), "yyyy-MM-dd");
  const completedAtDate = getDate(completedAt);
  if (completedAt && completedAtDate) {
    dateToUpdate = format(completedAtDate, "yyyy-MM-dd");
  }

  // multiplier based on isCompleted state, it determines if the current count is to be added or subtracted from the list
  const completedAtMultiplier = isCompleted ? -1 : 1;

  return {
    updates: [
      { path: ["distribution", "completion_chart", dateToUpdate], value: multiplier * completedAtMultiplier },
      {
        path: ["estimate_distribution", "completion_chart", dateToUpdate],
        value: multiplier * completedAtMultiplier * estimatePoint,
      },
    ],
    isCompleted,
  };
};

/**
 * Method to update distribution of either cycle or module object
 * @param distributionObject
 * @param distributionUpdates
 */
export const updateDistribution = (distributionObject: ICycle | IModule, distributionUpdates: DistributionUpdates) => {
  const { pathUpdates, assigneeUpdates, labelUpdates } = distributionUpdates;

  // iterate over path updates and directly apply changes on the distribution object
  for (const update of pathUpdates) {
    const { path, value } = update;
    const currentValue: number = get(distributionObject, path);
    if (currentValue !== undefined) set(distributionObject, path, (currentValue ?? 0) + value);
  }

  // for assignee update iterate through the assignee update and apply at the respective position
  for (const assigneeUpdate of assigneeUpdates) {
    const { id } = assigneeUpdate;

    // find and update the assignee issue counts
    if (Array.isArray(distributionObject.distribution?.assignees)) {
      const issuesAssignee = distributionObject.distribution?.assignees?.find(
        (assignee) => assignee.assignee_id === id
      );
      if (issuesAssignee) {
        issuesAssignee.completed_issues += assigneeUpdate.completed_issues ?? 0;
        issuesAssignee.pending_issues += assigneeUpdate.pending_issues ?? 0;
        issuesAssignee.total_issues += assigneeUpdate.total_issues;
      }
    }

    // find and update the assignee points
    if (Array.isArray(distributionObject.estimate_distribution?.assignees)) {
      const pointsAssignee = distributionObject.estimate_distribution?.assignees?.find(
        (assignee) => assignee.assignee_id === id
      );
      if (pointsAssignee) {
        pointsAssignee.completed_estimates += assigneeUpdate.completed_estimates ?? 0;
        pointsAssignee.pending_estimates += assigneeUpdate.pending_estimates ?? 0;
        pointsAssignee.total_estimates += assigneeUpdate.total_estimates;
      }
    }
  }

  for (const labelUpdate of labelUpdates) {
    const { id } = labelUpdate;

    // find and update the label issue counts
    if (Array.isArray(distributionObject.distribution?.labels)) {
      const issuesLabel = distributionObject.distribution?.labels?.find((label) => label.label_id === id);
      if (issuesLabel) {
        issuesLabel.completed_issues += labelUpdate.completed_issues ?? 0;
        issuesLabel.pending_issues += labelUpdate.pending_issues ?? 0;
        issuesLabel.total_issues += labelUpdate.total_issues;
      }
    }

    // find and update the label points
    if (Array.isArray(distributionObject.estimate_distribution?.labels)) {
      const pointsLabel = distributionObject.estimate_distribution?.labels?.find((label) => label.label_id === id);
      if (pointsLabel) {
        pointsLabel.completed_estimates += labelUpdate.completed_estimates ?? 0;
        pointsLabel.pending_estimates += labelUpdate.pending_estimates ?? 0;
        pointsLabel.total_estimates += labelUpdate.total_estimates;
      }
    }
  }
};
