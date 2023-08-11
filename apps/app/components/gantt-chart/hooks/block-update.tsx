import { KeyedMutator } from "swr";

// services
import issuesService from "services/issues.service";
// types
import { ICurrentUserResponse, IIssue } from "types";
import { IBlockUpdateData } from "../types";

export const updateGanttIssue = (
  issue: IIssue,
  payload: IBlockUpdateData,
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

    if (payload.sort_order) {
      const removedElement = newList.splice(payload.sort_order.sourceIndex, 1)[0];
      removedElement.sort_order = payload.sort_order.newSortOrder;
      newList.splice(payload.sort_order.destinationIndex, 0, removedElement);
    }

    return newList;
  }, false);

  const newPayload: any = { ...payload };

  if (newPayload.sort_order && payload.sort_order)
    newPayload.sort_order = payload.sort_order.newSortOrder;

  issuesService
    .patchIssue(workspaceSlug, issue.project, issue.id, newPayload, user)
    .finally(() => mutate());
};
