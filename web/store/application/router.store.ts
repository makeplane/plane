import { action, makeObservable, observable } from "mobx";
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
}

export class RouterStore implements IRouterStore {
  query: ParsedUrlQuery = {};

  constructor() {
    makeObservable(this, {
      query: observable,
      setQuery: action,

      //computed
      workspaceSlug: action,
      projectId: action,
      cycleId: action,
      moduleId: action,
      viewId: action,
      userId: action,
      peekId: action,
    });
  }

  setQuery(query: ParsedUrlQuery) {
    this.query = query;
  }

  get workspaceSlug() {
    return this.query?.workspace_slug?.toString();
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
}
