import sortBy from "lodash/sortBy";
// types
import { TInboxIssueOrderByOptions } from "@plane/types";
import { IInboxIssueStore } from "store/inbox-issue.store";

export const orderInboxIssue = (
  inboxIssues: IInboxIssueStore[],
  orderByKey: TInboxIssueOrderByOptions | undefined
): IInboxIssueStore[] => {
  let orderedInboxIssues: IInboxIssueStore[] = [];
  if (inboxIssues.length === 0 || !orderByKey) return [];

  switch (orderByKey) {
    case "issue__sequence_id":
      orderedInboxIssues = sortBy(inboxIssues, [(m) => m.issue.sequence_id]);
      break;
    case "-issue__sequence_id":
      orderedInboxIssues = sortBy(inboxIssues, [(m) => !m.issue.sequence_id]);
      break;
    case "issue__created_at":
      orderedInboxIssues = sortBy(inboxIssues, [(m) => m.issue.created_at]);
      break;
    case "-issue__created_at":
      orderedInboxIssues = sortBy(inboxIssues, [(m) => !m.issue.created_at]);
      break;
    case "issue__updated_at":
      orderedInboxIssues = sortBy(inboxIssues, [(m) => m.issue.updated_at]);
      break;
    case "-issue__updated_at":
      orderedInboxIssues = sortBy(inboxIssues, [(m) => !m.issue.updated_at]);
      break;
    default:
      orderedInboxIssues = sortBy(inboxIssues, [(m) => m.issue.created_at]);
      break;
  }
  return orderedInboxIssues;
};
