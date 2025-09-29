/* eslint-disable no-useless-catch */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane web services
import worklogService from "@/plane-web/services/workspace-worklog.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import { TWorklog, TWorklogIssue } from "@/plane-web/types";

export interface IWorklog extends TWorklog {
  // computed
  asJson: TWorklog;
  // helper actions
  mutateWorklog: (worklog: TWorklog) => void;
  // actions
  updateWorklog: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    payload: Partial<TWorklog>
  ) => Promise<TWorklog | undefined>;
}

export class Worklog implements IWorklog {
  // observables
  id: string | undefined = undefined;
  description: string | undefined = undefined;
  logged_by: string | undefined = undefined;
  duration: number | undefined = undefined;
  workspace_id: string | undefined = undefined;
  project_id: string | undefined = undefined;
  issue_detail: TWorklogIssue | undefined = undefined;
  created_by: string | undefined = undefined;
  updated_by: string | undefined = undefined;
  created_at: string | undefined = undefined;
  updated_at: string | undefined = undefined;

  constructor(
    protected store: RootStore,
    protected worklog: TWorklog
  ) {
    makeObservable(this, {
      // observables
      id: observable.ref,
      description: observable.ref,
      logged_by: observable.ref,
      duration: observable.ref,
      workspace_id: observable.ref,
      project_id: observable.ref,
      issue_detail: observable.ref,
      created_by: observable.ref,
      updated_by: observable.ref,
      created_at: observable.ref,
      updated_at: observable.ref,
      // computed
      asJson: computed,
      // actions
      updateWorklog: action,
    });

    this.id = worklog.id;
    this.description = worklog.description;
    this.logged_by = worklog.logged_by;
    this.duration = worklog.duration;
    this.workspace_id = worklog.workspace_id;
    this.project_id = worklog.project_id;
    this.issue_detail = worklog.issue_detail;
    this.created_by = worklog.created_by;
    this.updated_by = worklog.updated_by;
    this.created_at = worklog.created_at;
    this.updated_at = worklog.updated_at;
  }

  // computed
  get asJson() {
    return {
      id: this.id,
      description: this.description,
      logged_by: this.logged_by,
      duration: this.duration,
      workspace_id: this.workspace_id,
      project_id: this.project_id,
      issue_detail: this.issue_detail,
      created_by: this.created_by,
      updated_by: this.updated_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // helper actions
  mutateWorklog = (worklog: TWorklog) => {
    runInAction(() => {
      Object.entries(worklog).forEach(([key, value]) => {
        if (key in this) {
          set(this, key, value);
        }
      });
    });
  };

  // actions
  /**
   * @description update worklog
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { string } issueId
   * @param { Partial<TWorklog> } payload
   * @returns { TWorklog | undefined }
   */
  updateWorklog = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    payload: Partial<TWorklog>
  ): Promise<TWorklog | undefined> => {
    if (!workspaceSlug || !projectId || !issueId || !this.id) return undefined;
    const worklog = this.asJson;

    try {
      const worklogResponse = await worklogService.updateWorklogById(
        workspaceSlug,
        projectId,
        issueId,
        this.id,
        payload
      );
      if (worklogResponse) {
        runInAction(() => {
          this.mutateWorklog(worklogResponse);
          this.store.workspaceWorklogs.issueWorklogTotalMinutes[issueId] =
            this.store.workspaceWorklogs.issueWorklogTotalMinutes[issueId] -
            (Number(worklog.duration) - Number(payload.duration));
        });
      }
      return worklogResponse;
    } catch (error) {
      console.error("worklog -> updateWorklogById -> error", error);
      runInAction(() => {
        this.mutateWorklog(worklog);
        this.store.workspaceWorklogs.issueWorklogTotalMinutes[issueId] =
          this.store.workspaceWorklogs.issueWorklogTotalMinutes[issueId];
      });
      throw error;
    }
  };
}
