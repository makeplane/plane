// Moving functions from storage.sqlite.ts to storage.sqlite.utils.ts
import { TIssue } from "@plane/types";
import { ARRAY_FIELDS, BOOLEAN_FIELDS } from "./constants";
import { runQuery } from "./query-executor";

/**
 * Formats an issue fetched from local db into the required format
 * @param issue - Raw issue data from database
 * @returns Formatted issue with proper types
 */

export const formatLocalIssue = (
  issue: any
): TIssue & { group_id?: string; total_issues: number; sub_group_id?: string } => {
  const currIssue = { ...issue };

  // Parse array fields from JSON strings
  ARRAY_FIELDS.forEach((field: string) => {
    currIssue[field] = currIssue[field] ? JSON.parse(currIssue[field]) : [];
  });

  // Convert boolean fields to actual boolean values
  BOOLEAN_FIELDS.forEach((field: string) => {
    currIssue[field] = currIssue[field] === 1;
  });

  return currIssue;
};

/**
 * Gets the last updated issue for a project
 * @param projectId - Project identifier
 * @returns Promise<any | undefined> - Last updated issue or undefined
 */
export const getLastUpdatedIssue = async (projectId: string): Promise<any | undefined> => {
  const lastUpdatedIssue = await runQuery(
    `select id, name, updated_at, sequence_id from issues WHERE project_id='${projectId}' AND is_local_update IS NULL order by datetime(updated_at) desc limit 1`
  );

  return lastUpdatedIssue.length ? lastUpdatedIssue[0] : undefined;
};

/**
 * Gets the last sync time for a project
 * @param projectId - Project identifier
 * @returns Promise<string | false> - Last sync time or false
 */
export const getLastSyncTime = async (projectId: string): Promise<string | false> => {
  const issue = await getLastUpdatedIssue(projectId);
  if (!issue) {
    return false;
  }
  return issue.updated_at;
};

/**
 * Gets the count of issues for a project
 * @param projectId - Project identifier
 * @returns Promise<number> - Count of issues
 */
export const getIssueCount = async (projectId: string): Promise<number> => {
  const count = await runQuery(`select count(*) as count from issues where project_id='${projectId}'`);
  return count[0]["count"];
};

/**
 * Gets an option value
 * @param key - Option key
 * @param fallback - Fallback value
 * @returns Option value or fallback
 */
export const getOption = async (
  key: string,
  fallback?: string | boolean | number
): Promise<string | boolean | number | undefined> => {
  try {
    const options = await runQuery(`select * from options where key='${key}'`);
    if (options.length) {
      return options[0].value;
    }

    return fallback;
  } catch (e) {
    return fallback;
  }
};

/**
 * Sets an option value
 * @param key - Option key
 * @param value - Option value
 */
export const setOption = async (key: string, value: string): Promise<void> => {
  await runQuery(`insert or replace into options (key, value) values ('${key}', '${value}')`);
};

/**
 * Deletes an option
 * @param key - Option key
 */
export const deleteOption = async (key: string): Promise<void> => {
  await runQuery(` DELETE FROM options where key='${key}'`);
};

/**
 * Gets multiple options
 * @param keys - Option keys
 * @returns Options data
 */
export const getOptions = async (keys: string[]): Promise<Record<string, string | boolean | number>> => {
  const options = await runQuery(`select * from options where key in ('${keys.join("','")}')`);
  return options.reduce((acc: any, option: any) => {
    acc[option.key] = option.value;
    return acc;
  }, {});
};
