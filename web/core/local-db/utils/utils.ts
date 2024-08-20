import pick from "lodash/pick";
import { rootStore } from "@/lib/store-context";
import { TIssue } from "@plane/types";
import { ARRAY_FIELDS, PRIORITY_MAP } from "./constants";
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

export const wrapDateTime = (field: string) => {
  const DATE_TIME_FIELDS = ["created_at", "updated_at", "completed_at", "start_date", "target_date"];

  if (DATE_TIME_FIELDS.includes(field)) {
    return `datetime(${field})`;
  }
  return field;
};

export const filterConstructor = (filters: any) => {
  let sql = "";
  if (filters.priority) {
    filters.priority_proxy = filters.priority
      .split(",")
      .map((priority: string) => PRIORITY_MAP[priority])
      .join(",");
    delete filters.priority;
  }
  const keys = Object.keys(filters);

  keys.forEach((key) => {
    const value = filters[key] ? filters[key].split(",") : "";
    if (!value) return;
    if (ARRAY_FIELDS.includes(key)) {
      sql += ` AND im.key='${key}' AND value IN ('${value.join("','")}')`;
    } else {
      sql += ` AND ${key} in ('${value.join("','")}')`;
    }
  });
  return sql;
};

export const getGroupedIssueResults = (issueResults: (TIssue & { group_id: string; total_issues: number })[]): any => {
  const groupedResults: {
    [key: string]: {
      results: TIssue[];
      total_results: number;
    };
  } = {};

  for (const issue of issueResults) {
    const { group_id, total_issues } = issue;
    const groupId = group_id ? group_id : "None";
    if (groupedResults?.[groupId] !== undefined && Array.isArray(groupedResults?.[groupId]?.results)) {
      groupedResults?.[groupId]?.results.push(issue);
    } else {
      groupedResults[groupId] = { results: [issue], total_results: total_issues };
    }
  }

  return groupedResults;
};
