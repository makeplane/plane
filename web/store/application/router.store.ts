import { action, makeObservable, observable, computed, runInAction } from "mobx";
import { ParsedUrlQuery } from "node:querystring";

export interface IRouterStore {
  // observables
  query: ParsedUrlQuery;
  // actions
  setQuery: (query: ParsedUrlQuery) => void;
  // computed
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  cycleId: string | undefined;
  moduleId: string | undefined;
  viewId: string | undefined;
  globalViewId: string | undefined;
  userId: string | undefined;
  peekId: string | undefined;
  issueId: string | undefined;
  inboxId: string | undefined;
  webhookId: string | undefined;
}

export class RouterStore implements IRouterStore {
  // observables
  query: ParsedUrlQuery = {};

  constructor() {
    makeObservable(this, {
      // observables
      query: observable,
      // actions
      setQuery: action,
      //computed
      workspaceSlug: computed,
      projectId: computed,
      cycleId: computed,
      moduleId: computed,
      viewId: computed,
      globalViewId: computed,
      userId: computed,
      peekId: computed,
      issueId: computed,
      inboxId: computed,
      webhookId: computed,
    });
  }

  setQuery = (query: ParsedUrlQuery) => {
    runInAction(() => {
      this.query = query;
    });
  };

  get workspaceSlug() {
    return this.query?.workspaceSlug?.toString();
  }

  get projectId() {
    return this.query?.projectId?.toString();
  }

  get moduleId() {
    return this.query?.moduleId?.toString();
  }

  get cycleId() {
    return this.query?.cycleId?.toString();
  }

  get viewId() {
    return this.query?.viewId?.toString();
  }

  get globalViewId() {
    return this.query?.globalViewId?.toString();
  }

  get userId() {
    return this.query?.userId?.toString();
  }

  get peekId() {
    return this.query?.peekId?.toString();
  }

  get issueId() {
    return this.query?.issueId?.toString();
  }

  get inboxId() {
    return this.query?.inboxId?.toString();
  }

  get webhookId() {
    return this.query?.webhookId?.toString();
  }
}
