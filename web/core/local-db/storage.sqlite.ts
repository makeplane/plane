import * as Comlink from "comlink";
import set from "lodash/set";
// plane
import { EIssueGroupBYServerToProperty } from "@plane/constants";
import { TIssue, TIssueParams } from "@plane/types";
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
import { sanitizeWorkItemQueries } from "./utils/query-sanitizer.ts";
import { createTables } from "./utils/tables";
import { clearOPFS, getGroupedIssueResults, getSubGroupedIssueResults, log, logError } from "./utils/utils";

const DB_VERSION = 1.3;
const PAGE_SIZE = 500;
const BATCH_SIZE = 50;

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

  constructor() {
    this.db = null;

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.closeDBConnection);
    }
  }

  closeDBConnection = async () => {
    if (this.db) {
      await this.db.close();
    }
  };

  reset = () => {
    if (this.db) {
      this.db.close();
    }
    this.db = null;
    this.status = undefined;
    this.projectStatus = {};
    this.workspaceSlug = "";
  };

  clearStorage = async (force = false) => {
    try {
      await this.db?.close();
      await clearOPFS(force);
      this.reset();
    } catch (e) {
      console.error("Error clearing sqlite sync storage", e);
    }
  };

  private initializeWorker = async (workspaceSlug: string) => {
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
  };

  initialize = async (workspaceSlug: string): Promise<boolean> => {
    if (!rootStore.user.localDBEnabled) return false; // return if the window gets hidden

    if (workspaceSlug !== this.workspaceSlug) {
      this.reset();
    }

    try {
      await this._initialize(workspaceSlug);
      return true;
    } catch (err) {
      logError(err);
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

    try {
      this.workspaceSlug = workspaceSlug;
      this.dbName = workspaceSlug;
      await this.initializeWorker(workspaceSlug);

      const dbVersion = await this.getOption("DB_VERSION");
      log("Stored db version", dbVersion);
      log("Current db version", DB_VERSION);
      // Check if the database version matches the current version
      // If there's a mismatch, clear storage to avoid compatibility issues
      if (
        dbVersion !== undefined &&
        dbVersion !== "" &&
        !isNaN(Number(dbVersion)) &&
        Number(dbVersion) !== DB_VERSION
      ) {
        log("Database version mismatch detected - clearing storage to ensure compatibility");
        await this.clearStorage();
        await this.initializeWorker(workspaceSlug);
      } else {
        log("Database version matches current version - proceeding with data load");
      }

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

  syncWorkspace = async () => {
    if (!rootStore.user.localDBEnabled) return;
    const syncInProgress = await this.getIsWriteInProgress("sync_workspace");
    if (syncInProgress) {
      log("Sync in progress, skipping");
      return;
    }
    try {
      this.setOption("sync_workspace", new Date().toUTCString());
      await loadWorkSpaceData(this.workspaceSlug);
      this.deleteOption("sync_workspace");
    } catch (e) {
      logError(e);
      this.deleteOption("sync_workspace");
    }
  };

  syncProject = async (projectId: string) => {
    if (
      // document.hidden ||
      !rootStore.user.localDBEnabled
    )
      return false; // return if the window gets hidden

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

  syncIssues = async (projectId: string) => {
    if (!rootStore.user.localDBEnabled || !this.db) {
      return false;
    }
    try {
      const sync = this._syncIssues(projectId);
      this.setSync(projectId, sync);
      await sync;
    } catch (e) {
      logError(e);
      this.setStatus(projectId, "error");
    }
  };

  _syncIssues = async (projectId: string) => {
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
    log("### Time taken to add work items", performance.now() - start);

    if (status === "loading") {
      await createIndexes();
    }
    this.setOption(projectId, "ready");
    this.setStatus(projectId, "ready");
    this.setSync(projectId, undefined);
  };

  getIssueCount = async (projectId: string) => {
    const count = await runQuery(`select count(*) as count from issues where project_id='${projectId}'`);
    return count[0]["count"];
  };

  getLastUpdatedIssue = async (projectId: string) => {
    const lastUpdatedIssue = await runQuery(
      `select id, name, updated_at , sequence_id from issues WHERE project_id='${projectId}' AND is_local_update IS NULL order by datetime(updated_at) desc limit 1 `
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

  getIssues = async (
    workspaceSlug: string,
    projectId: string,
    queries: Partial<Record<TIssueParams, string | boolean>> | undefined,
    config: any
  ) => {
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

    const sanitizedQueries = sanitizeWorkItemQueries(workspaceSlug, projectId, queries);
    const { cursor, group_by, sub_group_by } = sanitizedQueries || {};

    const query = issueFilterQueryConstructor(this.workspaceSlug, projectId, sanitizedQueries);
    log("#### Query", query);
    const countQuery = issueFilterCountQueryConstructor(this.workspaceSlug, projectId, sanitizedQueries);
    const start = performance.now();
    let issuesRaw: any[] = [];
    let count: any[];
    try {
      [issuesRaw, count] = await Promise.all([runQuery(query), runQuery(countQuery)]);
    } catch (e) {
      log("Unable to get work items from local db, falling back to server");
      logError(e);
      const issueService = new IssueService();
      return await issueService.getIssuesFromServer(workspaceSlug, projectId, queries, config);
    }
    const end = performance.now();

    const { total_count } = count[0];

    const [pageSize, page, offset] = cursor && typeof cursor === "string" ? cursor.split(":") : [];

    const groupByProperty: string =
      EIssueGroupBYServerToProperty[group_by as keyof typeof EIssueGroupBYServerToProperty];
    const subGroupByProperty =
      EIssueGroupBYServerToProperty[sub_group_by as keyof typeof EIssueGroupBYServerToProperty];

    const parsingStart = performance.now();
    let issueResults = issuesRaw.map((issue: any) => formatLocalIssue(issue));

    log("#### Work item Results", issueResults.length);

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
    return out;
  };

  getIssue = async (issueId: string) => {
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

  getSubIssues = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const workspace_synced_at = await this.getOption("workspace_synced_at");
    if (!workspace_synced_at) {
      const issueService = new IssueService();
      return await issueService.subIssues(workspaceSlug, projectId, issueId);
    }
    return await getSubIssuesWithDistribution(issueId);
  };

  getStatus = (projectId: string) => this.projectStatus[projectId]?.issues?.status || undefined;
  setStatus = (projectId: string, status: "loading" | "ready" | "error" | "syncing" | undefined = undefined) => {
    set(this.projectStatus, `${projectId}.issues.status`, status);
  };

  getSync = (projectId: string) => this.projectStatus[projectId]?.issues?.sync;
  setSync = (projectId: string, sync: Promise<void> | undefined) => {
    set(this.projectStatus, `${projectId}.issues.sync`, sync);
  };

  getOption = async (key: string, fallback?: string | boolean | number) => {
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
  setOption = async (key: string, value: string) => {
    await runQuery(`insert or replace into options (key, value) values ('${key}', '${value}')`);
  };

  deleteOption = async (key: string) => {
    await runQuery(` DELETE FROM options where key='${key}'`);
  };
  getOptions = async (keys: string[]) => {
    const options = await runQuery(`select * from options where key in ('${keys.join("','")}')`);
    return options.reduce((acc: any, option: any) => {
      acc[option.key] = option.value;
      return acc;
    }, {});
  };

  getIsWriteInProgress = async (op: string) => {
    const writeStartTime = await this.getOption(op, false);
    if (writeStartTime) {
      // Check if it has been more than 5seconds
      const current = new Date();
      const start = new Date(writeStartTime);

      if (current.getTime() - start.getTime() < 5000) {
        return true;
      }
      return false;
    }
    return false;
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
  // Convert boolean fields to actual boolean values
  BOOLEAN_FIELDS.forEach((field: string) => {
    currIssue[field] = currIssue[field] === 1;
  });
  return currIssue as TIssue & { group_id?: string; total_issues: number; sub_group_id?: string };
};
