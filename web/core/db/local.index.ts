import { rootStore } from "@/lib/store-context";
import { IssueService } from "@/services/issue";
import { IIssueDisplayFilterOptions, IIssueFilterOptions, IIssueFilters, TIssue } from "@plane/types";
import Dexie, { type EntityTable } from "dexie";
import { get, set } from "lodash";
import { keys } from "ts-transformer-keys";

type ProjectSyncState = {
  id: string;
  lastSynced?: Date;
  isSyncing?: Promise<void>;
};

export const ISSUE_FILTER_MAP: Record<keyof IIssueFilterOptions, keyof TIssue> = {
  project: "project_id",
  cycle: "cycle_id",
  module: "module_ids",
  state: "state_id",
  state_group: "state_group" as keyof TIssue, // state_detail.group is only being used for state_group display,
  priority: "priority",
  labels: "label_ids",
  created_by: "created_by",
  assignees: "assignee_ids",
  target_date: "target_date",
  start_date: "start_date",
};

type DexieDB = Dexie & {
  issues: EntityTable<
    TIssue,
    "id" // primary key "id" (for the typings only)
  >;
  projects: EntityTable<
    ProjectSyncState,
    "id" // primary key "id" (for the typings only)
  >;
};
class IssueDB {
  db: DexieDB;
  issueService: IssueService;
  projectSyncMap: Record<string, ProjectSyncState> = {};

  constructor() {
    this.db = this.getNewInstantiatedDB();
    this.db.version(1).stores({
      projects: "id,lastSynced",
      issues:
        "id,sequence_id,name,sort_order,state_id,priority,label_ids,assignee_ids,estimate_point,sub_issues_count,attachment_count,link_count,project_id,parent_id,cycle_id,module_ids,created_at,updated_at,start_date,target_date,completed_at,archived_at,created_by,updated_by,is_draft,description_html,is_subscribed,parent,issue_reactions,issue_attachment,issue_link",
    });
    this.issueService = new IssueService();
    this.initiateProjectMap();
  }

  getNewInstantiatedDB() {
    this.clearDB();
    return new Dexie("IssuesDB") as DexieDB;
  }

  clearDB() {
    this.db?.delete();
  }

  async initiateProjectMap() {
    const projectSyncDetails = await this.db.projects.toArray();

    for (const syncState of projectSyncDetails) {
      set(this.projectSyncMap, syncState.id, syncState);
    }
  }

  async updateProjectSyncState(syncState: ProjectSyncState) {
    await this.db.projects.bulkPut([syncState]);
  }

  async loadIssues(workSpaceSlug: string, projectId: string, params?: any) {
    try {
      const issueResponse = await this.issueService.getIssues(workSpaceSlug, projectId, {
        cursor: "1000:0:0",
        per_page: 1000,
        ...params,
      });

      await this.db.issues.bulkPut(issueResponse.results as TIssue[]);

      if (issueResponse.total_pages > 1) {
        const promiseArray = [];
        for (let i = 1; i < issueResponse.total_pages; i++) {
          promiseArray.push(
            this.issueService.getIssues(workSpaceSlug, projectId, { cursor: `1000:${i}:0`, per_page: 1000, ...params })
          );
        }

        const responseArray = await Promise.all(promiseArray);

        for (const currIssueResponse of responseArray) {
          await this.db.issues.bulkPut(currIssueResponse.results as TIssue[]);
        }
      }
    } catch (e) {
      console.error("error while syncing project, ", projectId, e);
      throw new Error("Error while syncing Project Issues" + projectId);
    }
  }

  async syncIssues(workSpaceSlug: string, projectId: string, lastSynced: Date) {
    await this.loadIssues(workSpaceSlug, projectId, { updated_at__gt: lastSynced });
    //this.issueService.getDeletedIssues(workSpaceSlug, projectId, )
  }

  async getIssues(workSpaceSlug: string, projectId: string, issueFilters: IIssueFilters | undefined) {
    try {
      const startTime = performance.now();
      let projectSyncState: ProjectSyncState | undefined = get(this.projectSyncMap, projectId);

      if (!projectSyncState) {
        set(this.projectSyncMap, projectId, { id: projectId });
        projectSyncState = get(this.projectSyncMap, projectId);
      }

      const syncTime = new Date();
      // if (projectSyncState?.isSyncing) await projectSyncState?.isSyncing;
      // else
      if (projectSyncState?.lastSynced) {
        projectSyncState.isSyncing = this.syncIssues(workSpaceSlug, projectId, projectSyncState?.lastSynced);
        await projectSyncState?.isSyncing;
        projectSyncState.lastSynced = syncTime;
      } else {
        projectSyncState.isSyncing = this.loadIssues(workSpaceSlug, projectId);
        await projectSyncState?.isSyncing;
        projectSyncState.lastSynced = syncTime;
      }
      projectSyncState.isSyncing = undefined;

      this.updateProjectSyncState(projectSyncState);

      const filterFunction = this.issueFilterByValues(issueFilters?.filters, issueFilters?.displayFilters);

      const queryStartTime = performance.now();
      let query: any = this.db.issues;
      if (filterFunction) query = this.db.issues.filter(filterFunction);

      const issueArray = (await query.toArray()) as TIssue[];

      console.log("### IndexDB Querying Took, ", performance.now() - queryStartTime, "ms");
      console.log("### getIssues Took, ", performance.now() - startTime, "ms");
      return issueArray;
    } catch (e) {
      console.error("error while fetching issues", projectId, issueFilters, e);
      throw new Error("Error while fetching Issues" + projectId);
    }
  }

  issueFilterByValues = (
    filters: IIssueFilterOptions | undefined,
    displayFilters: IIssueDisplayFilterOptions | undefined
  ) => {
    if (!filters || !displayFilters) return;

    return (issue: TIssue) => {
      const filterKeys = Object.keys(filters) as (keyof IIssueFilterOptions)[];

      for (const filterKey of filterKeys) {
        const filterIssueKey = ISSUE_FILTER_MAP[filterKey];

        const filterValue = filters[filterKey];
        const issueValue = issue[filterIssueKey] as string | string[] | null | undefined;

        if (!filterValue || filterValue.length <= 0) continue;

        if (!issueValue || this.shouldFilterOutIssue(issueValue, filterValue, filterKey)) return false;
      }

      if (!displayFilters.sub_issue && issue.parent) return false;

      return true;
    };
  };

  shouldFilterOutIssue(issueValue: string | string[], filterValue: string[], filterKey: keyof IIssueFilterOptions) {
    if (filterKey.endsWith("date")) {
    } else if (filterKey === "state_group" && !Array.isArray(issueValue)) {
      const issueStateGroup = rootStore?.state?.stateMap?.[issueValue]?.group;

      if (!issueStateGroup || !filterValue.includes(issueStateGroup)) return true;
    } else {
      if (Array.isArray(issueValue)) {
        if (!filterValue.every((value: string) => issueValue.includes(value))) return true;
      } else if (!filterValue.includes(issueValue)) {
        return true;
      }
    }

    return false;
  }
}

export const issueDB = new IssueDB();
