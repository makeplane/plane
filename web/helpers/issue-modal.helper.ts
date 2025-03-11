import set from "lodash/set";
// types
import type { TIssue } from "@plane/types";

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
