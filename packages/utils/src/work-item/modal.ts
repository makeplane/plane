// plane imports
import { DEFAULT_WORK_ITEM_FORM_VALUES } from "@plane/constants";
import { IPartialProject, ISearchIssueResponse, IState, TIssue } from "@plane/types";

export const getUpdateFormDataForReset = (projectId: string | null | undefined, formData: Partial<TIssue>) => ({
  ...DEFAULT_WORK_ITEM_FORM_VALUES,
  project_id: projectId,
  name: formData.name,
  description_html: formData.description_html,
  priority: formData.priority,
  start_date: formData.start_date,
  target_date: formData.target_date,
});

export const convertWorkItemDataToSearchResponse = (
  workspaceSlug: string,
  workItem: TIssue,
  project: IPartialProject | undefined,
  state: IState | undefined
): ISearchIssueResponse => ({
  id: workItem.id,
  name: workItem.name,
  project_id: workItem.project_id ?? "",
  project__identifier: project?.identifier ?? "",
  project__name: project?.name ?? "",
  sequence_id: workItem.sequence_id,
  type_id: workItem.type_id ?? "",
  state__color: state?.color ?? "",
  start_date: workItem.start_date,
  state__group: state?.group ?? "backlog",
  state__name: state?.name ?? "",
  workspace__slug: workspaceSlug,
});
