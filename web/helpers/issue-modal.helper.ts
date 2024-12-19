import set from "lodash/set";
// types
import type { TIssue } from "@plane/types";
import { EIssuesStoreType } from "@/constants/issue";

export function getChangedIssuefields(formData: Partial<TIssue>, dirtyFields: { [key: string]: boolean | undefined }) {
  const changedFields = {};

  const dirtyFieldKeys = Object.keys(dirtyFields) as (keyof TIssue)[];
  for (const dirtyField of dirtyFieldKeys) {
    if (!!dirtyFields[dirtyField]) {
      set(changedFields, [dirtyField], formData[dirtyField]);
    }
  }

  return changedFields as Partial<TIssue>;
}

export const getModalTitle = (issueId: string | undefined, storeType: EIssuesStoreType, isDraft: boolean) => {
  if (issueId) {
    return "Update";
  }
  if (isDraft) {
    return "Create a draft";
  }

  switch (storeType) {
    case EIssuesStoreType.EPIC:
      return "Create Epic";
    default:
      return "Create new issue";
  }
};
