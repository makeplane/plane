import pick from "lodash/pick";
import { TIssue } from "@plane/types";
import { rootStore } from "@/lib/store-context";
import { persistence } from "../storage.sqlite";
import { updateIssue } from "./load-issues";

export const log = (...args: any) => {
  if ((window as any).DEBUG) {
    console.log(...args);
  }
};
export const logError = (e: any) => {
  if (e?.result?.errorClass === "SQLite3Error") {
    e = parseSQLite3Error(e);
  }
  console.error(e);
};
export const logInfo = console.info;

export const addIssueToPersistanceLayer = async (issue: TIssue) => {
  try {
    const issuePartial = pick({ ...JSON.parse(JSON.stringify(issue)) }, [
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
      "type_id",
      "description_html",
    ]);
    await updateIssue({ ...issuePartial, is_local_update: 1 });
  } catch (e) {
    logError("Error while adding issue to db");
  }
};

export const updatePersistentLayer = async (issueIds: string | string[]) => {
  if (typeof issueIds === "string") {
    issueIds = [issueIds];
  }
  issueIds.forEach(async (issueId) => {
    const dbIssue = await persistence.getIssue(issueId);
    const issue = rootStore.issue.issues.getIssueById(issueId);
    const updatedIssue = dbIssue ? { ...dbIssue, ...issue } : issue;

    if (updatedIssue) {
      addIssueToPersistanceLayer(updatedIssue);
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

export const getGroupedIssueResults = (issueResults: (TIssue & { group_id?: string; total_issues: number })[]): any => {
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

export const getSubGroupedIssueResults = (
  issueResults: (TIssue & { group_id?: string; total_issues: number; sub_group_id?: string })[]
): any => {
  const subGroupedResults: {
    [key: string]: {
      results: {
        [key: string]: {
          results: TIssue[];
          total_results: number;
        };
      };
      total_results: number;
    };
  } = {};

  for (const issue of issueResults) {
    const { group_id, total_issues, sub_group_id } = issue;
    const groupId = group_id ? group_id : "None";
    const subGroupId = sub_group_id ? sub_group_id : "None";

    if (subGroupedResults?.[groupId] === undefined) {
      subGroupedResults[groupId] = { results: {}, total_results: 0 };
    }

    if (
      subGroupedResults[groupId].results[subGroupId] !== undefined &&
      Array.isArray(subGroupedResults[groupId].results[subGroupId]?.results)
    ) {
      subGroupedResults[groupId].results[subGroupId]?.results.push(issue);
    } else {
      subGroupedResults[groupId].results[subGroupId] = { results: [issue], total_results: total_issues };
    }
  }

  const groupByKeys = Object.keys(subGroupedResults);

  for (const groupByKey of groupByKeys) {
    let totalIssues = 0;
    const groupedResults = subGroupedResults[groupByKey]?.results ?? {};
    const subGroupByKeys = Object.keys(groupedResults);

    for (const subGroupByKey of subGroupByKeys) {
      const subGroupedResultsCount = groupedResults[subGroupByKey].total_results ?? 0;
      totalIssues += subGroupedResultsCount;
    }

    subGroupedResults[groupByKey].total_results = totalIssues;
  }

  return subGroupedResults;
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseSQLite3Error = (error: any) => {
  error.result = JSON.stringify(error.result);
  return error;
};

export const isChrome = () => {
  const userAgent = navigator.userAgent;
  return userAgent.includes("Chrome") && !userAgent.includes("Edg") && !userAgent.includes("OPR");
};

export const clearOPFS = async (force = false) => {
  const storageManager = window.navigator.storage;
  const root = await storageManager.getDirectory();

  if (force && isChrome()) {
    await (root as any).remove({ recursive: true });
    return;
  }
  // ts-ignore
  for await (const entry of (root as any)?.values()) {
    if (entry.kind === "directory" && entry.name.startsWith(".ahp-")) {
      // A lock with the same name as the directory protects it from
      // being deleted.

      if (force) {
        // don't wait for the lock
        try {
          await root.removeEntry(entry.name, { recursive: true });
        } catch (e) {
          console.log(e);
        }
      } else {
        await navigator.locks.request(entry.name, { ifAvailable: true }, async (lock) => {
          if (lock) {
            log?.(`Deleting temporary directory ${entry.name}`);
            try {
              await root.removeEntry(entry.name, { recursive: true });
            } catch (e) {
              console.log(e);
            }
          } else {
            log?.(`Temporary directory ${entry.name} is in use`);
          }
        });
      }
    } else {
      root.removeEntry(entry.name);
    }
  }
};
