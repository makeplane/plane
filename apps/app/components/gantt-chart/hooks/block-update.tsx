import { KeyedMutator } from "swr";

// services
import issuesService from "services/issues.service";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { ICurrentUserResponse, IIssue } from "types";

export const updateGanttIssue = (
  issue: IIssue,
  payload: {
    sort_order?: number;
    start_date?: string;
    target_date?: string;
  },
  mutate: KeyedMutator<any>,
  user: ICurrentUserResponse | undefined,
  workspaceSlug: string | undefined
) => {
  if (!issue || !workspaceSlug || !user) return;

  mutate((prevData: IIssue[]) => {
    if (!prevData) return prevData;

    const newList = prevData.map((p) => ({
      ...p,
      ...(p.id === issue.id ? payload : {}),
    }));

    return payload.sort_order ? orderArrayBy(newList, "sort_order") : newList;
  }, false);

  issuesService
    .patchIssue(workspaceSlug, issue.project, issue.id, payload, user)
    .finally(() => mutate());
};
