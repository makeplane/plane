import * as Sentry from "@sentry/nextjs";
import set from "lodash/set";
// plane
import { EIssueGroupBYServerToProperty } from "@plane/constants";
import { TIssue } from "@plane/types";
// lib
import { rootStore } from "@/lib/store-context";
// services
import { IssueService } from "@/services/issue/issue.service";
//
import { ARRAY_FIELDS } from "./utils/constants";
import { getSubIssuesWithDistribution } from "./utils/data.utils";
import createIndexes from "./utils/indexes";
import { addIssuesBulk, syncDeletesToLocal } from "./utils/load-issues";
import { loadWorkSpaceData } from "./utils/load-workspace";
import { issueFilterCountQueryConstructor, issueFilterQueryConstructor } from "./utils/query-constructor";
import { runQuery } from "./utils/query-executor";
import { createTables } from "./utils/tables";
import { getGroupedIssueResults, getSubGroupedIssueResults, log, logError, logInfo } from "./utils/utils";

declare module "@sqlite.org/sqlite-wasm" {
  export function sqlite3Worker1Promiser(...args: any): any;
}

const DB_VERSION = 1;
const PAGE_SIZE = 1000;
const BATCH_SIZE = 200;

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
  }

  reset = () => {
    this.db = null;
    this.status = undefined;
    this.projectStatus = {};
    this.workspaceSlug = "";
  };

  clearStorage = async () => {
    try {
      const storageManager = window.navigator.storage;
      const fileSystemDirectoryHandle = await storageManager.getDirectory();
      //@ts-expect-error , clear local issue cache
      await fileSystemDirectoryHandle.remove({ recursive: true });
      this.reset();
    } catch (e) {
      console.error("Error clearing sqlite sync storage", e);
    }
  };

  initialize = async (workspaceSlug: string): Promise<boolean> => {
    if (document.hidden || !rootStore.user.localDBEnabled) return false; // return if the window gets hidden

    if (workspaceSlug !== this.workspaceSlug) {
      this.reset();
    }
    try {
      await Sentry.startSpan({ name: "INIT_DB" }, async () => await this._initialize(workspaceSlug));
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

    logInfo("Loading and initializing SQLite3 module...");

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

      // dump DB of db version is matching
      const dbVersion = await this.getOption("DB_VERSION");
      if (dbVersion !== "" && parseInt(dbVersion) !== DB_VERSION) {
        await this.clearStorage();
        this.reset();
        await this._initialize(workspaceSlug);
        return false;
      }

      log(
        "OPFS is available, created persisted database at",
        openResponse.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, "$1")
      );
      this.status = "ready";
      // Your SQLite code here.
      await createTables();

      await this.setOption("DB_VERSION", DB_VERSION.toString());
    } catch (err) {
      logError(err);
      throw err;
    }

    return true;
  };

  syncWorkspace = async () => {
    if (document.hidden || !rootStore.user.localDBEnabled) return; // return if the window gets hidden
    await Sentry.startSpan({ name: "LOAD_WS", attributes: { slug: this.workspaceSlug } }, async () => {
      await loadWorkSpaceData(this.workspaceSlug);
    });
  };

  syncProject = async (projectId: string) => {
    if (document.hidden || !rootStore.user.localDBEnabled) return false; // return if the window gets hidden

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
    if (document.hidden || !rootStore.user.localDBEnabled) return false; // return if the window gets hidden

    try {
      const sync = Sentry.startSpan({ name: `SYNC_ISSUES` }, () => this._syncIssues(projectId));
      this.setSync(projectId, sync);
      await sync;
    } catch (e) {
      logError(e);
      this.setStatus(projectId, "error");
    }
  };

  _syncIssues = async (projectId: string) => {
    const activeSpan = Sentry.getActiveSpan();

    log("### Sync started");
    let status = this.getStatus(projectId);
    if (status === "loading" || status === "syncing") {
      logInfo(`Project ${projectId} is already loading or syncing`);
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
    addIssuesBulk(response.results, BATCH_SIZE);

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
      count: response.total_count,
    });
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

  getIssues = async (workspaceSlug: string, projectId: string, queries: any, config: any) => {
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
        logInfo(`Project ${projectId} is loading, falling back to server`);
      }
      const issueService = new IssueService();
      return await issueService.getIssuesFromServer(workspaceSlug, projectId, queries);
    }

    const { cursor, group_by, sub_group_by } = queries;

    const query = issueFilterQueryConstructor(this.workspaceSlug, projectId, queries);
    const countQuery = issueFilterCountQueryConstructor(this.workspaceSlug, projectId, queries);
    const start = performance.now();
    let issuesRaw: any[] = [];
    let count: any[];
    try {
      [issuesRaw, count] = await Promise.all([runQuery(query), runQuery(countQuery)]);
    } catch (e) {
      logError(e);
      const issueService = new IssueService();
      return await issueService.getIssuesFromServer(workspaceSlug, projectId, queries);
    }
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
    log(issueResults);
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

    const activeSpan = Sentry.getActiveSpan();
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

  getIssue = async (issueId: string) => {
    try {
      if (!rootStore.user.localDBEnabled) return;

      const issues = await runQuery(`select * from issues where id='${issueId}'`);
      if (issues.length) {
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

  getOption = async (key: string, fallback = "") => {
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

  getOptions = async (keys: string[]) => {
    const options = await runQuery(`select * from options where key in ('${keys.join("','")}')`);
    return options.reduce((acc: any, option: any) => {
      acc[option.key] = option.value;
      return acc;
    }, {});
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
  return currIssue as TIssue & { group_id?: string; total_issues: number; sub_group_id?: string };
};
