import { getActiveSpan, startSpan } from "@sentry/nextjs";
import * as Comlink from "comlink";
import set from "lodash/set";
// plane
import { EIssueGroupBYServerToProperty } from "@plane/constants";
import { TIssue } from "@plane/types";
// lib
import { rootStore } from "@/lib/store-context";
// services
import { IssueService } from "@/services/issue/issue.service";
//
import { ARRAY_FIELDS, BOOLEAN_FIELDS } from "./utils/constants";
import { getSubIssuesWithDistribution } from "./utils/data.utils";
import createIndexes from "./utils/indexes";
import { addIssuesBulk, syncDeletesToLocal } from "./utils/load-issues";
import { loadWorkSpaceData } from "./utils/load-workspace";
import { issueFilterCountQueryConstructor, issueFilterQueryConstructor } from "./utils/query-constructor";
import { runQuery } from "./utils/query-executor";
import { createTables } from "./utils/tables";
import { clearOPFS, getGroupedIssueResults, getSubGroupedIssueResults, log, logError } from "./utils/utils";

/** Database version for schema management */
const DB_VERSION = 1;
/** Number of items per page for pagination */
const PAGE_SIZE = 500;
/** Number of items to process in a single batch */
const BATCH_SIZE = 50;

/** Project status type definition */
type TProjectStatus = {
  issues: {
    status: undefined | "loading" | "ready" | "error" | "syncing";
    sync: Promise<void> | undefined;
  };
};

/** Database status type definition */
type TDBStatus = "initializing" | "ready" | "error" | undefined;

/**
 * Storage class for managing local SQLite database operations
 * Handles database initialization, synchronization, and CRUD operations for issues
 */
export class Storage {
  private db: any;
  private status: TDBStatus = undefined;
  private dbName = "plane";
  private projectStatus: Record<string, TProjectStatus> = {};
  private workspaceSlug: string = "";

  constructor() {
    this.db = null;

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.closeDBConnection);
    }
  }

  /**
   * Closes the database connection
   * @returns Promise<void>
   */
  private closeDBConnection = async (): Promise<void> => {
    if (this.db) {
      await this.db.close();
    }
  };

  /**
   * Resets the database state
   */
  public reset = (): void => {
    if (this.db) {
      this.db.close();
    }
    this.db = null;
    this.status = undefined;
    this.projectStatus = {};
    this.workspaceSlug = "";
  };

  /**
   * Clears the storage and resets the database
   * @param force - Force clear storage
   */
  public clearStorage = async (force = false): Promise<void> => {
    try {
      await this.db?.close();
      await clearOPFS(force);
      this.reset();
    } catch (error) {
      logError(error);
      console.error("Error clearing sqlite sync storage", error);
    }
  };

  /**
   * Initializes the database for a given workspace
   * @param workspaceSlug - Workspace identifier
   * @returns Promise<boolean> - True if initialization is successful
   */
  public initialize = async (workspaceSlug: string): Promise<boolean> => {
    if (!rootStore.user.localDBEnabled) return false; // return if the window gets hidden

    if (workspaceSlug !== this.workspaceSlug) {
      this.reset();
    }

    try {
      await startSpan({ name: "INIT_DB" }, async () => await this._initialize(workspaceSlug));
      return true;
    } catch (err) {
      logError(err);
      this.status = "error";
      return false;
    }
  };

  /**
   * Initializes the database for a given workspace
   * @param workspaceSlug - Workspace identifier
   * @returns Promise<boolean> - True if initialization is successful
   */
  private _initialize = async (workspaceSlug: string): Promise<boolean> => {
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

    try {
      const { DBClass } = await import("./worker/db");
      const worker = new Worker(new URL("./worker/db.ts", import.meta.url));
      const MyWorker = Comlink.wrap<typeof DBClass>(worker);

      // Add cleanup on window unload
      window.addEventListener("unload", () => worker.terminate());

      this.workspaceSlug = workspaceSlug;
      this.dbName = workspaceSlug;
      const instance = await new MyWorker();
      await instance.init(workspaceSlug);

      this.db = {
        exec: instance.exec,
        close: instance.close,
      };

      this.status = "ready";
      // Your SQLite code here.
      await createTables();

      await this.setOption("DB_VERSION", DB_VERSION.toString());
      return true;
    } catch (error) {
      this.status = "error";
      this.db = null;
      throw new Error(`Failed to initialize database worker: ${error}`);
    }
  };

  /**
   * Synchronizes the workspace data
   */
  public syncWorkspace = async (): Promise<void> => {
    if (!rootStore.user.localDBEnabled) return;
    const syncInProgress = await this.getIsWriteInProgress("sync_workspace");
    if (syncInProgress) {
      log("Sync in progress, skipping");
      return;
    }
    try {
      await startSpan({ name: "LOAD_WS", attributes: { slug: this.workspaceSlug } }, async () => {
        this.setOption("sync_workspace", new Date().toUTCString());
        await loadWorkSpaceData(this.workspaceSlug);
        this.deleteOption("sync_workspace");
      });
    } catch (e) {
      logError(e);
      this.deleteOption("sync_workspace");
    }
  };

  /**
   * Synchronizes the project data
   * @param projectId - Project identifier
   */
  public syncProject = async (projectId: string): Promise<void> => {
    if (
      // document.hidden ||
      !rootStore.user.localDBEnabled
    ) {
      return; // return if the window gets hidden
    }
    // Load labels, members, states, modules, cycles
    await this.syncIssues(projectId);

    // // Sync rest of the projects
    // const projects = await getProjectIds();

    // // Exclude the one we just synced
    // const projectsToSync = projects.filter((p: string) => p !== projectId);
    // for (const project of projectsToSync) {
    //   await delay(8000);
    //   await this.syncIssues(project);
    // }
    // this.setOption("workspace_synced_at", new Date().toISOString());
  };

  /**
   * Synchronizes the issues for a project
   * @param projectId - Project identifier
   */
  public syncIssues = async (projectId: string): Promise<void> => {
    if (!rootStore.user.localDBEnabled || !this.db) {
      return;
    }
    try {
      const sync = startSpan({ name: `SYNC_ISSUES` }, () => this._syncIssues(projectId));
      this.setSync(projectId, sync);
      await sync;
    } catch (e) {
      logError(e);
      this.setStatus(projectId, "error");
    }
  };

  /**
   * Synchronizes the issues for a project
   * @param projectId - Project identifier
   */
  private _syncIssues = async (projectId: string): Promise<void> => {
    const activeSpan = getActiveSpan();

    log("### Sync started");
    let status = this.getStatus(projectId);
    if (status === "loading" || status === "syncing") {
      log(`Project ${projectId} is already loading or syncing`);
      return;
    }
    const syncPromise = this.getSync(projectId);

    if (syncPromise) {
      // Redundant check?
      return;
    }

    const queryParams: { cursor: string; updated_at__gt?: string; description: boolean } = {
      cursor: `${PAGE_SIZE}:0:0`,
      description: true,
    };

    const syncedAt = await this.getLastSyncTime(projectId);
    const projectSync = await this.getOption(projectId);

    if (syncedAt) {
      queryParams["updated_at__gt"] = syncedAt;
    }

    this.setStatus(projectId, projectSync === "ready" ? "syncing" : "loading");
    status = this.getStatus(projectId);

    log(`### ${projectSync === "ready" ? "Syncing" : "Loading"} issues to local db for project ${projectId}`);

    const start = performance.now();
    const issueService = new IssueService();

    const response = await issueService.getIssuesForSync(this.workspaceSlug, projectId, queryParams);

    await addIssuesBulk(response.results, BATCH_SIZE);
    if (response.total_pages > 1) {
      const promiseArray = [];
      for (let i = 1; i < response.total_pages; i++) {
        queryParams.cursor = `${PAGE_SIZE}:${i}:0`;
        promiseArray.push(issueService.getIssuesForSync(this.workspaceSlug, projectId, queryParams));
      }
      const pages = await Promise.all(promiseArray);
      for (const page of pages) {
        await addIssuesBulk(page.results, BATCH_SIZE);
      }
    }

    if (syncedAt) {
      await syncDeletesToLocal(this.workspaceSlug, projectId, { updated_at__gt: syncedAt });
    }
    log("### Time taken to add issues", performance.now() - start);

    if (status === "loading") {
      await createIndexes();
    }
    this.setOption(projectId, "ready");
    this.setStatus(projectId, "ready");
    this.setSync(projectId, undefined);

    activeSpan?.setAttributes({
      projectId: projectId,
      count: response?.total_results,
    });
  };

  /**
   * Gets the count of issues for a project
   * @param projectId - Project identifier
   * @returns Promise<number> - Count of issues
   */
  public getIssueCount = async (projectId: string): Promise<number> => {
    const count = await runQuery(`select count(*) as count from issues where project_id='${projectId}'`);
    return count[0]["count"];
  };

  /**
   * Gets the last updated issue for a project
   * @param projectId - Project identifier
   * @returns Promise<any | undefined> - Last updated issue or undefined
   */
  public getLastUpdatedIssue = async (projectId: string): Promise<any | undefined> => {
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
  public getLastSyncTime = async (projectId: string): Promise<string | false> => {
    const issue = await this.getLastUpdatedIssue(projectId);
    if (!issue) {
      return false;
    }
    return issue.updated_at;
  };

  /**
   * Gets issues for a project
   * @param workspaceSlug - Workspace identifier
   * @param projectId - Project identifier
   * @param queries - Query parameters
   * @param config - Configuration options
   * @returns Promise<any> - Issues data
   */
  public getIssues = async (workspaceSlug: string, projectId: string, queries: any, config: any): Promise<any> => {
    log("#### Queries", queries);

    const currentProjectStatus = this.getStatus(projectId);
    if (
      !currentProjectStatus ||
      this.status !== "ready" ||
      currentProjectStatus === "loading" ||
      currentProjectStatus === "error" ||
      !rootStore.user.localDBEnabled
    ) {
      if (rootStore.user.localDBEnabled) {
        log(`Project ${projectId} is loading, falling back to server`);
      }
      const issueService = new IssueService();

      // Ignore projectStatus if projectId is not provided
      if (projectId) {
        return await issueService.getIssuesFromServer(workspaceSlug, projectId, queries, config);
      }
      if (this.status !== "ready" && !rootStore.user.localDBEnabled) {
        return;
      }
    }

    const { cursor, group_by, sub_group_by } = queries;

    const query = issueFilterQueryConstructor(this.workspaceSlug, projectId, queries);
    log("#### Query", query);
    const countQuery = issueFilterCountQueryConstructor(this.workspaceSlug, projectId, queries);
    const start = performance.now();
    let issuesRaw: any[] = [];
    let count: any[];
    try {
      [issuesRaw, count] = await startSpan(
        { name: "GET_ISSUES" },
        async () => await Promise.all([runQuery(query), runQuery(countQuery)])
      );
    } catch (e) {
      logError(e);
      const issueService = new IssueService();
      return await issueService.getIssuesFromServer(workspaceSlug, projectId, queries, config);
    }
    const end = performance.now();

    const { total_count } = count[0];

    const [pageSize, page, offset] = cursor.split(":");

    const groupByProperty: string =
      EIssueGroupBYServerToProperty[group_by as keyof typeof EIssueGroupBYServerToProperty];
    const subGroupByProperty =
      EIssueGroupBYServerToProperty[sub_group_by as keyof typeof EIssueGroupBYServerToProperty];

    const parsingStart = performance.now();
    let issueResults = issuesRaw.map((issue: any) => formatLocalIssue(issue));

    log("#### Issue Results", issueResults.length);

    const parsingEnd = performance.now();

    const grouping = performance.now();
    if (groupByProperty && page === "0") {
      if (subGroupByProperty) {
        issueResults = getSubGroupedIssueResults(issueResults);
      } else {
        issueResults = getGroupedIssueResults(issueResults);
      }
    }
    const groupCount = group_by ? Object.keys(issueResults).length : undefined;
    // const subGroupCount = sub_group_by ? Object.keys(issueResults[Object.keys(issueResults)[0]]).length : undefined;
    const groupingEnd = performance.now();

    const times = {
      IssueQuery: end - start,
      Parsing: parsingEnd - parsingStart,
      Grouping: groupingEnd - grouping,
    };
    if ((window as any).DEBUG) {
      console.table(times);
    }
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

    const activeSpan = getActiveSpan();
    activeSpan?.setAttributes({
      projectId,
      count: total_count,
      groupBy: group_by,
      subGroupBy: sub_group_by,
      queries: queries,
      local: true,
      groupCount,
      // subGroupCount,
    });
    return out;
  };

  /**
   * Gets an issue by ID
   * @param issueId - Issue identifier
   * @returns Promise<any | undefined> - Issue data or undefined
   */
  public getIssue = async (issueId: string): Promise<any | undefined> => {
    try {
      if (!rootStore.user.localDBEnabled || this.status !== "ready") return;

      const issues = await runQuery(`select * from issues where id='${issueId}'`);
      if (Array.isArray(issues) && issues.length) {
        return formatLocalIssue(issues[0]);
      }
    } catch (err) {
      logError(err);
      console.warn("unable to fetch issue from local db");
    }

    return;
  };

  /**
   * Gets sub-issues for an issue
   * @param workspaceSlug - Workspace identifier
   * @param projectId - Project identifier
   * @param issueId - Issue identifier
   * @returns Promise<any> - Sub-issues data
   */
  public getSubIssues = async (workspaceSlug: string, projectId: string, issueId: string): Promise<any> => {
    const workspace_synced_at = await this.getOption("workspace_synced_at");
    if (!workspace_synced_at) {
      const issueService = new IssueService();
      return await issueService.subIssues(workspaceSlug, projectId, issueId);
    }
    return await getSubIssuesWithDistribution(issueId);
  };

  /**
   * Gets the status of a project
   * @param projectId - Project identifier
   * @returns Project status or undefined
   */
  public getStatus = (projectId: string): "loading" | "ready" | "error" | "syncing" | undefined =>
    this.projectStatus[projectId]?.issues?.status || undefined;

  /**
   * Sets the status of a project
   * @param projectId - Project identifier
   * @param status - New status
   */
  public setStatus = (
    projectId: string,
    status: "loading" | "ready" | "error" | "syncing" | undefined = undefined
  ): void => {
    set(this.projectStatus, `${projectId}.issues.status`, status);
  };

  /**
   * Gets the sync promise for a project
   * @param projectId - Project identifier
   * @returns Sync promise or undefined
   */
  public getSync = (projectId: string): Promise<void> | undefined => this.projectStatus[projectId]?.issues?.sync;

  /**
   * Sets the sync promise for a project
   * @param projectId - Project identifier
   * @param sync - Sync promise
   */
  public setSync = (projectId: string, sync: Promise<void> | undefined): void => {
    set(this.projectStatus, `${projectId}.issues.sync`, sync);
  };

  /**
   * Gets an option value
   * @param key - Option key
   * @param fallback - Fallback value
   * @returns Option value or fallback
   */
  public getOption = async (
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
  public setOption = async (key: string, value: string): Promise<void> => {
    await runQuery(`insert or replace into options (key, value) values ('${key}', '${value}')`);
  };

  /**
   * Deletes an option
   * @param key - Option key
   */
  public deleteOption = async (key: string): Promise<void> => {
    await runQuery(` DELETE FROM options where key='${key}'`);
  };

  /**
   * Gets multiple options
   * @param keys - Option keys
   * @returns Options data
   */
  public getOptions = async (keys: string[]): Promise<Record<string, string | boolean | number>> => {
    const options = await runQuery(`select * from options where key in ('${keys.join("','")}')`);
    return options.reduce((acc: any, option: any) => {
      acc[option.key] = option.value;
      return acc;
    }, {});
  };

  /**
   * Checks if a write operation is in progress
   * @param op - Operation identifier
   * @returns Promise<boolean> - True if write is in progress
   */
  public getIsWriteInProgress = async (op: string): Promise<boolean> => {
    const writeStartTime = await this.getOption(op, false);
    if (writeStartTime) {
      const current = new Date();
      const start = new Date(writeStartTime);

      return current.getTime() - start.getTime() < 5000;
    }
    return false;
  };
}

export const persistence = new Storage();

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
