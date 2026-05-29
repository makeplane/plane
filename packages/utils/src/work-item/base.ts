import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { isEmpty } from "lodash-es";
import { v4 as uuidv4 } from "uuid";
// plane imports
import type { TIssueFilterPriorityObject, TIssuePriorities } from "@plane/constants";
import { ISSUE_DISPLAY_FILTERS_BY_PAGE, ISSUE_PRIORITY_FILTERS, STATE_GROUPS } from "@plane/constants";
import type {
  IGanttBlock,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  TGroupedIssues,
  TIssue,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  TIssueParams,
  TStateGroups,
  TSubGroupedIssues,
  TUnGroupedIssues,
} from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
// local imports
import { orderArrayBy } from "../array";
import { getDate } from "../datetime";
import { isEditorEmpty } from "../editor";

type THandleIssuesMutation = (
  formData: Partial<TIssue>,
  oldGroupTitle: string,
  selectedGroupBy: TIssueGroupByOptions,
  issueIndex: number,
  orderBy: TIssueOrderByOptions,
  prevData?:
    | {
        [key: string]: TIssue[];
      }
    | TIssue[]
) =>
  | {
      [key: string]: TIssue[];
    }
  | TIssue[]
  | undefined;

export const handleIssuesMutation: THandleIssuesMutation = (
  formData,
  oldGroupTitle,
  selectedGroupBy,
  issueIndex,
  orderBy,
  prevData
) => {
  if (!prevData) return prevData;

  if (Array.isArray(prevData)) {
    const updatedIssue = {
      ...prevData[issueIndex],
      ...formData,
    };

    prevData.splice(issueIndex, 1, updatedIssue);

    return [...prevData];
  } else {
    const oldGroup = prevData[oldGroupTitle ?? ""] ?? [];

    let newGroup: TIssue[] = [];

    if (selectedGroupBy === "priority") newGroup = prevData[formData.priority ?? ""] ?? [];
    else if (selectedGroupBy === "state") newGroup = prevData[formData.state_id ?? ""] ?? [];

    const updatedIssue = {
      ...oldGroup[issueIndex],
      ...formData,
    };

    if (selectedGroupBy !== Object.keys(formData)[0])
      return {
        ...prevData,
        [oldGroupTitle ?? ""]: orderArrayBy(
          oldGroup.map((i) => (i.id === updatedIssue.id ? updatedIssue : i)),
          orderBy
        ),
      };

    const groupThatIsUpdated = selectedGroupBy === "priority" ? formData.priority : formData.state_id;

    return {
      ...prevData,
      [oldGroupTitle ?? ""]: orderArrayBy(
        oldGroup.filter((i) => i.id !== updatedIssue.id),
        orderBy
      ),
      [groupThatIsUpdated ?? ""]: orderArrayBy([...newGroup, updatedIssue], orderBy),
    };
  }
};

export const handleIssueQueryParamsByLayout = (
  layout: EIssueLayoutTypes | undefined,
  viewType:
    | "my_issues"
    | "issues"
    | "profile_issues"
    | "archived_issues"
    | "draft_issues"
    | "team_issues"
    | "team_project_work_items"
): TIssueParams[] | null => {
  const queryParams: TIssueParams[] = ["filters"];

  if (!layout) return null;

  const currentViewLayoutOptions = ISSUE_DISPLAY_FILTERS_BY_PAGE[viewType].layoutOptions[layout];

  // add display filters query params
  Object.keys(currentViewLayoutOptions.display_filters).forEach((option) => {
    queryParams.push(option as TIssueParams);
  });

  // add extra options query params
  if (currentViewLayoutOptions.extra_options.access) {
    currentViewLayoutOptions.extra_options.values.forEach((option) => {
      queryParams.push(option);
    });
  }

  return queryParams;
};

/**
 *
 * @description create a full issue payload with some default values. This function also parse the form field
 * like assignees, labels, etc. and add them to the payload
 * @param projectId project id to be added in the issue payload
 * @param formData partial issue data from the form. This will override the default values
 * @returns full issue payload with some default values
 */
export const createIssuePayload: (projectId: string, formData: Partial<TIssue>) => TIssue = (
  projectId: string,
  formData: Partial<TIssue>
) => {
  const payload: TIssue = {
    id: uuidv4(),
    project_id: projectId,
    priority: "none",
    label_ids: [],
    assignee_ids: [],
    sub_issues_count: 0,
    attachment_count: 0,
    link_count: 0,
    // tempId is used for optimistic updates. It is not a part of the API response.
    tempId: uuidv4(),
    // to be overridden by the form data
    ...formData,
  } as TIssue;

  return payload;
};

/**
 * @description check if the issue due date should be highlighted
 * @param date
 * @param stateGroup
 * @returns boolean
 */
export const shouldHighlightIssueDueDate = (
  date: string | Date | null,
  stateGroup: TStateGroups | undefined
): boolean => {
  if (!date || !stateGroup) return false;
  // if the issue is completed or cancelled, don't highlight the due date
  if ([STATE_GROUPS.completed.key, STATE_GROUPS.cancelled.key].includes(stateGroup)) return false;

  const parsedDate = getDate(date);
  if (!parsedDate) return false;

  const targetDateDistance = differenceInCalendarDays(parsedDate, new Date());

  // if the issue is overdue, highlight the due date
  return targetDateDistance <= 0;
};

export const getIssueBlocksStructure = (block: TIssue): IGanttBlock => ({
  data: block,
  id: block?.id,
  name: block?.name,
  sort_order: block?.sort_order,
  start_date: block?.start_date ?? undefined,
  target_date: block?.target_date ?? undefined,
  meta: {
    project_id: block?.project_id ?? undefined,
  },
});

export const formatTextList = (TextArray: string[]): string => {
  const count = TextArray.length;
  switch (count) {
    case 0:
      return "";
    case 1:
      return TextArray[0];
    case 2:
      return `${TextArray[0]} and ${TextArray[1]}`;
    case 3:
      return `${TextArray.slice(0, 2).join(", ")}, and ${TextArray[2]}`;
    case 4:
      return `${TextArray.slice(0, 3).join(", ")}, and ${TextArray[3]}`;
    default:
      return `${TextArray.slice(0, 3).join(", ")}, and +${count - 3} more`;
  }
};

export const getDescriptionPlaceholderI18n = (isFocused: boolean, description: string | undefined): string => {
  const isDescriptionEmpty = isEditorEmpty(description);
  if (!isDescriptionEmpty || isFocused) return "common.press_for_commands";
  else return "common.click_to_add_description";
};

export const issueCountBasedOnFilters = (
  issueIds: TGroupedIssues | TUnGroupedIssues | TSubGroupedIssues,
  layout: EIssueLayoutTypes,
  groupBy: string | undefined,
  subGroupBy: string | undefined
): number => {
  let issuesCount = 0;
  if (!layout) return issuesCount;

  if (["spreadsheet", "gantt_chart"].includes(layout)) {
    issuesCount = (issueIds as TUnGroupedIssues)?.length;
  } else if (layout === "calendar") {
    Object.keys(issueIds || {}).map((groupId) => {
      issuesCount += (issueIds as TGroupedIssues)?.[groupId]?.length;
    });
  } else if (layout === "list") {
    if (groupBy) {
      Object.keys(issueIds || {}).map((groupId) => {
        issuesCount += (issueIds as TGroupedIssues)?.[groupId]?.length;
      });
    } else {
      issuesCount = (issueIds as TUnGroupedIssues)?.length;
    }
  } else if (layout === "kanban") {
    if (groupBy && subGroupBy) {
      Object.keys(issueIds || {}).map((groupId) => {
        Object.keys((issueIds as TSubGroupedIssues)?.[groupId] || {}).map((subGroupId) => {
          issuesCount += (issueIds as TSubGroupedIssues)?.[groupId]?.[subGroupId]?.length || 0;
        });
      });
    } else if (groupBy) {
      Object.keys(issueIds || {}).map((groupId) => {
        issuesCount += (issueIds as TGroupedIssues)?.[groupId]?.length;
      });
    }
  }

  return issuesCount;
};

/**
 * @description This method is used to apply the display filters on the issues
 * @param {IIssueDisplayFilterOptions} displayFilters
 * @returns {IIssueDisplayFilterOptions}
 */
export const getComputedDisplayFilters = (
  displayFilters: IIssueDisplayFilterOptions = {},
  defaultValues?: IIssueDisplayFilterOptions
): IIssueDisplayFilterOptions => {
  const filters = !isEmpty(displayFilters) ? displayFilters : defaultValues;
  return {
    calendar: {
      show_weekends: filters?.calendar?.show_weekends || false,
      layout: filters?.calendar?.layout || "month",
    },
    layout: filters?.layout || EIssueLayoutTypes.LIST,
    order_by: filters?.order_by || "sort_order",
    group_by: filters?.group_by || null,
    sub_group_by: filters?.sub_group_by || null,
    sub_issue: filters?.sub_issue || false,
    show_empty_groups: filters?.show_empty_groups || false,
  };
};

/**
 * @description This method is used to apply the display properties on the issues
 * @param {IIssueDisplayProperties} displayProperties
 * @returns {IIssueDisplayProperties}
 */
export const getComputedDisplayProperties = (
  displayProperties: IIssueDisplayProperties = {}
): IIssueDisplayProperties => ({
  assignee: displayProperties?.assignee ?? true,
  start_date: displayProperties?.start_date ?? true,
  due_date: displayProperties?.due_date ?? true,
  labels: displayProperties?.labels ?? true,
  priority: displayProperties?.priority ?? true,
  state: displayProperties?.state ?? true,
  sub_issue_count: displayProperties?.sub_issue_count ?? true,
  attachment_count: displayProperties?.attachment_count ?? true,
  link: displayProperties?.link ?? true,
  estimate: displayProperties?.estimate ?? true,
  key: displayProperties?.key ?? true,
  created_on: displayProperties?.created_on ?? true,
  updated_on: displayProperties?.updated_on ?? true,
  modules: displayProperties?.modules ?? true,
  cycle: displayProperties?.cycle ?? true,
  issue_type: displayProperties?.issue_type ?? true,
});

export const generateWorkItemLink = ({
  workspaceSlug,
  projectId,
  issueId,
  projectIdentifier,
  sequenceId,
  isArchived = false,
  isEpic = false,
}: {
  workspaceSlug: string | undefined | null;
  projectId: string | undefined | null;
  issueId: string | undefined | null;
  projectIdentifier: string | undefined | null;
  sequenceId: string | number | undefined | null;
  isArchived?: boolean;
  isEpic?: boolean;
}): string => {
  const archiveIssueLink = `/${workspaceSlug}/projects/${projectId}/archives/issues/${issueId}`;
  const workItemLink = `/${workspaceSlug}/browse/${projectIdentifier}-${sequenceId}/`;
  const epicLink = workItemLink;

  return isArchived ? archiveIssueLink : isEpic ? epicLink : workItemLink;
};

export const getIssuePriorityFilters = (priorityKey: TIssuePriorities): TIssueFilterPriorityObject | undefined => {
  const currentIssuePriority: TIssueFilterPriorityObject | undefined =
    ISSUE_PRIORITY_FILTERS && ISSUE_PRIORITY_FILTERS.length > 0
      ? ISSUE_PRIORITY_FILTERS.find((_priority) => _priority.key === priorityKey)
      : undefined;

  if (currentIssuePriority) return currentIssuePriority;
  return undefined;
};
