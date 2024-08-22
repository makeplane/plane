import set from "lodash/set";
import { EIssueGroupBYServerToProperty } from "@plane/constants";
import { IssueService } from "@/services/issue/issue.service";
import { ARRAY_FIELDS } from "./utils/constants";
import { addIssuesBulk } from "./utils/load-issues";
import { loadLabels } from "./utils/load-labels";
import { issueFilterQueryConstructor, issueFilterCountQueryConstructor } from "./utils/query-constructor";
import { runQuery } from "./utils/query-executor";
import { createTables } from "./utils/tables";
import { getGroupedIssueResults, getSubGroupedIssueResults } from "./utils/utils";

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
  // issueService: any;

  constructor() {
    this.db = null;
    // this.issueService = new IssueService();
  }

  reset = () => {
    this.db = null;
    this.status = undefined;
    this.projectStatus = {};
    this.workspaceSlug = "";
  };

  initialize = async (workspaceSlug: string): Promise<boolean> => {
    this.workspaceInitPromise = this._initialize(workspaceSlug);
    await this.workspaceInitPromise;
  };

  _initialize = async (workspaceSlug: string): Promise<boolean> => {
    if (this.status === "initializing") {
      console.warn(`Initialization already in progress for workspace ${workspaceSlug}`);
      return true;
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
      await createTables(this.db);
    } catch (err) {
      error(err);
    }

    return true;
  };

  syncWorkspace = async () => {
    await this.workspaceInitPromise;
    loadLabels(this.workspaceSlug);
  };

  syncProject = async (projectId: string) => {
    // Load labels, members, states, modules, cycles

    const sync = this.syncIssues(projectId);
    this.setSync(projectId, sync);
  };

  syncIssues = async (projectId: string) => {
    console.log("### Sync started");
    if (this.getStatus(projectId) === "loading" || this.getStatus(projectId) === "syncing") {
      info(`Project ${projectId} is already loading or syncing`);
      return;
    }

    await this.getSync(projectId);

    const queryParams: { cursor: string; updated_at__gt?: string } = {
      cursor: `${PAGE_SIZE}:0:0`,
    };

    const syncedAt = await this.getLastSyncTime(projectId);

    if (syncedAt) {
      queryParams["updated_at__gt"] = syncedAt;
    }

    this.setStatus(projectId, syncedAt ? "syncing" : "loading");

    log(`### ${syncedAt ? "Syncing" : "Loading"} issues to local db for project ${projectId}`);

    const start = performance.now();
    const issueService = new IssueService();

    const response = await issueService.getIssuesFromServer(this.workspaceSlug, projectId, queryParams);
    addIssuesBulk(response.results, 500);

    if (response.total_pages > 1) {
      const promiseArray = [];
      for (let i = 1; i < response.total_pages; i++) {
        promiseArray.push(
          issueService.getIssuesFromServer(this.workspaceSlug, projectId, { cursor: `${PAGE_SIZE}:${i}:0` })
        );
      }
      const pages = await Promise.all(promiseArray);
      for (const page of pages) {
        await addIssuesBulk(page.results, 500);
      }
    }

    console.log("### Time taken to add issues", performance.now() - start);

    this.setStatus(projectId, "ready");
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
    if (this.getStatus(projectId) === "loading" || window.DISABLE_LOCAL) {
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

    const groupByProperty = EIssueGroupBYServerToProperty[group_by as typeof EIssueGroupBYServerToProperty];
    const subGroupByProperty = EIssueGroupBYServerToProperty[sub_group_by as typeof EIssueGroupBYServerToProperty];

    const parsingStart = performance.now();
    let issueResults = issuesRaw.map((issue: any) => {
      ARRAY_FIELDS.forEach((field: string) => {
        issue[field] = issue[field] ? JSON.parse(issue[field]) : [];
      });

      return issue;
    });

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
    // console.log("#### OUT", out);

    return out;
  };

  getStatus = (projectId: string) => this.projectStatus[projectId]?.issues?.status || undefined;
  setStatus = (projectId: string, status: "loading" | "ready" | "error" | "syncing" | undefined = undefined) => {
    set(this.projectStatus, `${projectId}.issues.status`, status);
  };

  getSync = (projectId: string) => this.projectStatus[projectId]?.issues?.sync;
  setSync = (projectId: string, sync: Promise<void>) => {
    this.projectStatus[projectId].issues.sync = sync;
  };
}

export const persistence = new Storage();
