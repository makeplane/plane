import { action, makeObservable, observable, computed } from "mobx";
import { ParsedUrlQuery } from "node:querystring";

export interface IRouterStore {
  query: ParsedUrlQuery;
  setQuery: (query: ParsedUrlQuery) => void;

  workspaceSlug: string | undefined;
  projectId: string | undefined;
  cycleId: string | undefined;
  moduleId: string | undefined;
  viewId: string | undefined;
  userId: string | undefined;
  peekId: string | undefined;
  issueId: string | undefined;
  inboxId: string | undefined;
  webhookId: string | undefined;
}

export class RouterStore implements IRouterStore {
  query: ParsedUrlQuery = {};

  constructor() {
    makeObservable(this, {
      query: observable,
      setQuery: action,

      //computed
      workspaceSlug: computed,
      projectId: computed,
      cycleId: computed,
      moduleId: computed,
      viewId: computed,
      userId: computed,
      peekId: computed,
      issueId: computed,
      inboxId: computed,
      webhookId: computed,
    });
  }

  setQuery(query: ParsedUrlQuery) {
    this.query = query;
  }

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
