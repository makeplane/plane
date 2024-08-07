import pick from "lodash/pick";
import { rootStore } from "@/lib/store-context";
import { updateIssue } from "./load-issues";

export const log = console.log;

// export const log = () => {};

export const updatePersistentLayer = async (issueIds: string | string[]) => {
  if (typeof issueIds === "string") {
    issueIds = [issueIds];
  }
  issueIds.forEach((issueId) => {
    const issue = rootStore.issue.issues.getIssueById(issueId);

    if (issue) {
      const issuePartial = pick(JSON.parse(JSON.stringify(issue)), [
        "id",
        "name",
        "state_id",
        "sort_order",
        "completed_at",
        "estimate_point",
        "priority",
        "start_date",
        "target_date",
        "sequence_id",
        "project_id",
        "parent_id",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
        "is_draft",
        "archived_at",
        "state__group",
        "cycle_id",
        "link_count",
        "attachment_count",
        "sub_issues_count",
        "assignee_ids",
        "label_ids",
        "module_ids",
      ]);
      updateIssue(issuePartial);
    }
  });
};
