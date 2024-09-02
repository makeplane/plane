import set from "lodash/set";
// plane
import { EIssueGroupBYServerToProperty } from "@plane/constants";
import { TIssue } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
// services
import { IssueService } from "@/services/issue/issue.service";
//
import { ARRAY_FIELDS } from "./utils/constants";
import createIndexes from "./utils/indexes";
import { addIssuesBulk, syncDeletesToLocal } from "./utils/load-issues";
import { loadWorkSpaceData } from "./utils/load-workspace";
import { issueFilterCountQueryConstructor, issueFilterQueryConstructor } from "./utils/query-constructor";
import { runQuery } from "./utils/query-executor";
import { createTables } from "./utils/tables";
import { getGroupedIssueResults, getSubGroupedIssueResults } from "./utils/utils";

declare module "@sqlite.org/sqlite-wasm" {
  export function sqlite3Worker1Promiser(...args: any): any;
}

const PAGE_SIZE = 1000;
const log = console.log;
const error = console.error;
const info = console.info;

type TProjectStatus = {
  issues: { status: undefined | "loading" | "ready" | "error" | "syncing"; sync: Promise<void> | undefined };
};

type TDBStatus = "initializing" | "ready" | "error" | undefined;
export class Storage {
  db: any;
  status: TDBStatus = undefined;
  dbName = "plane";
  projectStatus: Record<string, TProjectStatus> = {};
  workspaceSlug: string = "";
  workspaceInitPromise: Promise<boolean> | undefined;

  constructor() {
    this.db = null;
  }

  reset = () => {
    this.db = null;
    this.status = undefined;
    this.projectStatus = {};
    this.workspaceSlug = "";
    this.workspaceInitPromise = undefined;
  };

  clearStorage = async () => {
    try {
      const storageManager = window.navigator.storage;
      const fileSystemDirectoryHandle = await storageManager.getDirectory();
      //@ts-ignore
      await fileSystemDirectoryHandle.remove({ recursive: true });
    } catch (e) {
      console.error("Error clearing sqlite sync storage", e);
    }
  };

  initialize = async (workspaceSlug: string): Promise<boolean> => {
    if (workspaceSlug !== this.workspaceSlug) {
      this.reset();
    }
    if (this.workspaceInitPromise) {
      return this.workspaceInitPromise;
    }
    this.workspaceInitPromise = this._initialize(workspaceSlug);
    try {
      await this.workspaceInitPromise;
      return true;
    } catch (err) {
      error(err);
      this.status = "error";
      return false;
    }
  };

  _initialize = async (workspaceSlug: string): Promise<boolean> => {
    if (this.status === "initializing") {
      console.warn(`Initialization already in progress for workspace ${workspaceSlug}`);
      return false;
    }
    if (this.status === "ready") {
      console.warn(`Already initialized for workspace ${workspaceSlug}`);
      return true;
    }
    if (this.status === "error") {
      console.warn(`Initialization failed for workspace ${workspaceSlug}`);
      return false;
    }

    info("Loading and initializing SQLite3 module...");

    this.workspaceSlug = workspaceSlug;
    this.dbName = workspaceSlug;
    const { sqlite3Worker1Promiser } = await import("@sqlite.org/sqlite-wasm");

    try {
      const promiser: any = await new Promise((resolve) => {
        const _promiser = sqlite3Worker1Promiser({
          onready: () => resolve(_promiser),
        });
      });

      const configResponse = await promiser("config-get", {});
      log("Running SQLite3 version", configResponse.result.version.libVersion);

      const openResponse = await promiser("open", {
        filename: `file:${this.dbName}.sqlite3?vfs=opfs`,
      });
      const { dbId } = openResponse;
      this.db = {
        dbId,
        exec: async (val: any) => {
          if (typeof val === "string") {
            val = { sql: val };
          }
          return promiser("exec", { dbId, ...val });
        },
      };
      log(
        "OPFS is available, created persisted database at",
        openResponse.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, "$1")
      );
      this.status = "ready";
      // Your SQLite code here.
      await createTables();
    } catch (err) {
      error(err);
    }

    return true;
  };

  syncWorkspace = async () => {
    await this.workspaceInitPromise;
    loadWorkSpaceData(this.workspaceSlug);
  };

  syncProject = (projectId: string) => {
    // Load labels, members, states, modules, cycles

    this.syncIssues(projectId);
  };

  syncIssues = (projectId: string) => {
    const sync = this._syncIssues(projectId);
    this.setSync(projectId, sync);
  };

  _syncIssues = async (projectId: string) => {
    console.log("### Sync started");
    let status = this.getStatus(projectId);
    if (status === "loading" || status === "syncing") {
      info(`Project ${projectId} is already loading or syncing`);
      return;
    }
    const syncPromise = this.getSync(projectId);

    if (syncPromise) {
      // Redundant check?
      return;
    }

    const queryParams: { cursor: string; updated_at__gte?: string; description: boolean } = {
      cursor: `${PAGE_SIZE}:0:0`,
      description: true,
    };

    const syncedAt = await this.getLastSyncTime(projectId);

    if (syncedAt) {
      queryParams["updated_at__gte"] = syncedAt;
    }

    this.setStatus(projectId, syncedAt ? "syncing" : "loading");
    status = this.getStatus(projectId);

    log(`### ${syncedAt ? "Syncing" : "Loading"} issues to local db for project ${projectId}`);

    const start = performance.now();
    const issueService = new IssueService();

    const response = await issueService.getIssuesForSync(this.workspaceSlug, projectId, queryParams);
    addIssuesBulk(response.results, 500);

    if (response.total_pages > 1) {
      const promiseArray = [];
      for (let i = 1; i < response.total_pages; i++) {
        queryParams.cursor = `${PAGE_SIZE}:${i}:0`;
        promiseArray.push(issueService.getIssuesForSync(this.workspaceSlug, projectId, queryParams));
      }
      const pages = await Promise.all(promiseArray);
      for (const page of pages) {
        await addIssuesBulk(page.results, 500);
      }
    }

    await syncDeletesToLocal(this.workspaceSlug, projectId, { updated_at__gt: syncedAt });

    console.log("### Time taken to add issues", performance.now() - start);

    if (status === "loading") {
      await createIndexes();
      setToast({
        title: "Project synced",
        message: `in ${Math.round((performance.now() - start) / 1000)}s`,
        type: TOAST_TYPE.SUCCESS,
      });
    }
    this.setStatus(projectId, "ready");
    this.setSync(projectId, undefined);
  };

  getIssueCount = async (projectId: string) => {
    const count = await runQuery(`select count(*) as count from issues where project_id='${projectId}'`);
    return count[0]["count"];
  };

  getLastUpdatedIssue = async (projectId: string) => {
    const lastUpdatedIssue = await runQuery(
      `select id, name, updated_at , sequence_id from issues where project_id='${projectId}' order by datetime(updated_at) desc limit 1`
    );

    if (lastUpdatedIssue.length) {
      return lastUpdatedIssue[0];
    }
    return;
  };

  getLastSyncTime = async (projectId: string) => {
    const issue = await this.getLastUpdatedIssue(projectId);
    if (!issue) {
      return false;
    }
    return issue.updated_at;
  };

  getIssues = async (projectId: string, queries: any, config: any) => {
    console.log("#### Queries", queries);

    if (this.getStatus(projectId) === "loading" || (window as any).DISABLE_LOCAL) {
      info(`Project ${projectId} is loading, falling back to server`);
      const issueService = new IssueService();
      return await issueService.getIssuesFromServer(this.workspaceSlug, projectId, queries);
    }
    await this.getSync(projectId);

    const { cursor, group_by, sub_group_by } = queries;

    const query = issueFilterQueryConstructor(this.workspaceSlug, projectId, queries);
    const countQuery = issueFilterCountQueryConstructor(this.workspaceSlug, projectId, queries);
    const start = performance.now();
    const [issuesRaw, count] = await Promise.all([runQuery(query), runQuery(countQuery)]);
    // const issuesRaw = await runQuery(query);
    const end = performance.now();

    const { total_count } = count[0];
    // const total_count = 2300;

    const [pageSize, page, offset] = cursor.split(":");

    const groupByProperty: string =
      EIssueGroupBYServerToProperty[group_by as keyof typeof EIssueGroupBYServerToProperty];
    const subGroupByProperty =
      EIssueGroupBYServerToProperty[sub_group_by as keyof typeof EIssueGroupBYServerToProperty];

    const parsingStart = performance.now();
    let issueResults = issuesRaw.map((issue: any) => {
      return formatLocalIssue(issue);
    });

    console.log("#### Issue Results", issueResults.length);

    const parsingEnd = performance.now();

    const grouping = performance.now();
    if (groupByProperty && page === "0") {
      if (subGroupByProperty) {
        issueResults = getSubGroupedIssueResults(issueResults);
      } else {
        issueResults = getGroupedIssueResults(issueResults);
      }
    }
    const groupingEnd = performance.now();

    const times = {
      IssueQuery: end - start,
      Parsing: parsingEnd - parsingStart,
      Grouping: groupingEnd - grouping,
    };
    console.log(issueResults);
    console.table(times);

    const total_pages = Math.ceil(total_count / Number(pageSize));
    const next_page_results = total_pages > parseInt(page) + 1;

    const out = {
      results: issueResults,
      next_cursor: `${pageSize}:${parseInt(page) + 1}:${Number(offset) + Number(pageSize)}`,
      prev_cursor: `${pageSize}:${parseInt(page) - 1}:${Number(offset) - Number(pageSize)}`,
      total_results: total_count,
      total_count,
      next_page_results,
      total_pages,
    };

    return out;
  };

  getIssue = async (issueId: string) => {
    const issues = await runQuery(`select * from issues where id='${issueId}'`);
    if (issues.length) {
      return formatLocalIssue(issues[0]);
    }
    return;
  };
  getStatus = (projectId: string) => this.projectStatus[projectId]?.issues?.status || undefined;
  setStatus = (projectId: string, status: "loading" | "ready" | "error" | "syncing" | undefined = undefined) => {
    set(this.projectStatus, `${projectId}.issues.status`, status);
  };

  getSync = (projectId: string) => this.projectStatus[projectId]?.issues?.sync;
  setSync = (projectId: string, sync: Promise<void> | undefined) => {
    set(this.projectStatus, `${projectId}.issues.sync`, sync);
  };
}

export const persistence = new Storage();

/**
 * format the issue fetched from local db into an issue
 * @param issue
 * @returns
 */
export const formatLocalIssue = (issue: any) => {
  const currIssue = issue;
  ARRAY_FIELDS.forEach((field: string) => {
    currIssue[field] = currIssue[field] ? JSON.parse(currIssue[field]) : [];
  });
  return currIssue as TIssue;
};
