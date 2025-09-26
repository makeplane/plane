/* eslint-disable no-useless-catch */

import { set } from "lodash-es";
import { computed, makeObservable, observable, runInAction } from "mobx";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import { TWorklogDownloadFormat, TWorklogDownloadStatus, TWorklogDownload, TWorklogFilter } from "@/plane-web/types";

export interface IWorklogDownload extends TWorklogDownload {
  // computed
  asJson: TWorklogDownload;
  // helper actions
  mutateDownloadWorklog: (worklog: TWorklogDownload) => void;
}

export class WorklogDownload implements IWorklogDownload {
  // observables
  id: string | undefined = undefined;
  name: string | undefined = undefined;
  type: string | undefined = undefined;
  filters: TWorklogFilter | undefined = undefined;
  provider: TWorklogDownloadFormat | undefined = undefined;
  status: TWorklogDownloadStatus | undefined = undefined;
  url: string | undefined = undefined;
  token: string | undefined = undefined;
  workspace: string | undefined = undefined;
  project: string | undefined = undefined;
  initiated_by: string | undefined = undefined;
  created_by: string | undefined = undefined;
  updated_by: string | undefined = undefined;
  created_at: string | undefined = undefined;
  updated_at: string | undefined = undefined;

  constructor(
    protected store: RootStore,
    protected worklogDownload: TWorklogDownload
  ) {
    makeObservable(this, {
      // observables
      id: observable.ref,
      name: observable.ref,
      type: observable.ref,
      filters: observable,
      provider: observable.ref,
      status: observable.ref,
      url: observable.ref,
      token: observable.ref,
      workspace: observable.ref,
      project: observable.ref,
      initiated_by: observable.ref,
      created_by: observable.ref,
      updated_by: observable.ref,
      created_at: observable.ref,
      updated_at: observable.ref,
      // computed
      asJson: computed,
    });

    this.id = worklogDownload.id;
    this.name = worklogDownload.name;
    this.type = worklogDownload.type;
    this.filters = worklogDownload.filters;
    this.provider = worklogDownload.provider;
    this.status = worklogDownload.status;
    this.url = worklogDownload.url;
    this.token = worklogDownload.token;
    this.workspace = worklogDownload.workspace;
    this.project = worklogDownload.project;
    this.initiated_by = worklogDownload.initiated_by;
    this.created_by = worklogDownload.created_by;
    this.updated_by = worklogDownload.updated_by;
    this.created_at = worklogDownload.created_at;
    this.updated_at = worklogDownload.updated_at;
  }

  // computed
  get asJson() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      filters: this.filters,
      provider: this.provider,
      status: this.status,
      url: this.url,
      token: this.token,
      workspace: this.workspace,
      project: this.project,
      initiated_by: this.initiated_by,
      created_by: this.created_by,
      updated_by: this.updated_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // helper actions
  mutateDownloadWorklog = (worklogDownload: TWorklogDownload) => {
    runInAction(() => {
      Object.entries(worklogDownload).forEach(([key, value]) => {
        if (key in this) {
          set(this, key, value);
        }
      });
    });
  };
}
