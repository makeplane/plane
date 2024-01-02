import { v4 as uuidv4 } from "uuid";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import {
  TIssue,
  TIssueGroupByOptions,
  TIssueLayouts,
  TIssueOrderByOptions,
  TIssueParams,
  IProject,
  IWorkspace,
} from "@plane/types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

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
  layout: TIssueLayouts | undefined,
  viewType: "my_issues" | "issues" | "profile_issues" | "archived_issues" | "draft_issues"
): TIssueParams[] | null => {
  const queryParams: TIssueParams[] = [];

  if (!layout) return null;

  const layoutOptions = ISSUE_DISPLAY_FILTERS_BY_LAYOUT[viewType][layout];

  // add filters query params
  layoutOptions.filters.forEach((option) => {
    queryParams.push(option);
  });

  // add display filters query params
  Object.keys(layoutOptions.display_filters).forEach((option) => {
    queryParams.push(option as TIssueParams);
  });

  // add extra options query params
  if (layoutOptions.extra_options.access) {
    layoutOptions.extra_options.values.forEach((option) => {
      queryParams.push(option);
    });
  }

  // add start_target_date query param for the gantt_chart layout
  if (layout === "gantt_chart") queryParams.push("start_target_date");

  return queryParams;
};

/**
 *
 * @description create a full issue payload with some default values. This function also parse the form field
 * like assignees, labels, etc. and add them to the payload
 * @param workspaceDetail workspace detail to be added in the issue payload
 * @param projectDetail project detail to be added in the issue payload
 * @param formData partial issue data from the form. This will override the default values
 * @returns full issue payload with some default values
 */

export const createIssuePayload: (
  workspaceDetail: IWorkspace,
  projectDetail: IProject,
  formData: Partial<TIssue>
) => TIssue = (workspaceDetail: IWorkspace, projectDetail: IProject, formData: Partial<TIssue>) => {
  const payload = {
    archived_at: null,
    assignee_details: [],
    attachment_count: 0,
    attachments: [],
    issue_relations: [],
    related_issues: [],
    bridge_id: null,
    completed_at: new Date(),
    created_at: "",
    created_by: "",
    cycle: null,
    cycle_id: null,
    cycle_detail: null,
    description: {},
    description_html: "",
    description_stripped: "",
    estimate_point: null,
    issue_cycle: null,
    issue_link: [],
    issue_module: null,
    label_details: [],
    is_draft: false,
    links_list: [],
    link_count: 0,
    module: null,
    module_id: null,
    name: "",
    parent: null,
    parent_detail: null,
    priority: "none",
    project: projectDetail.id,
    project_detail: projectDetail,
    sequence_id: 0,
    sort_order: 0,
    sprints: null,
    start_date: null,
    state: projectDetail.default_state,
    state_detail: {} as any,
    sub_issues_count: 0,
    target_date: null,
    updated_at: "",
    updated_by: "",
    workspace: workspaceDetail.id,
    workspace_detail: workspaceDetail,
    id: uuidv4(),
    tempId: uuidv4(),
    // to be overridden by the form data
    ...formData,
    assignee_ids: Array.isArray(formData.assignee_ids)
      ? formData.assignee_ids
      : formData.assignee_ids && formData.assignee_ids !== "none" && formData.assignee_ids !== null
      ? [formData.assignee_ids]
      : [],
    label_ids: Array.isArray(formData.label_ids)
      ? formData.label_ids
      : formData.label_ids && formData.label_ids !== "none" && formData.label_ids !== null
      ? [formData.label_ids]
      : [],
  } as TIssue;

  return payload;
};
