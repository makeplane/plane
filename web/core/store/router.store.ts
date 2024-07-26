import { ParsedUrlQuery } from "node:querystring";
import { action, makeObservable, observable, computed, runInAction } from "mobx";

import { TProfileViews } from "@plane/types";
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
  profileViewId: TProfileViews | undefined;
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
      setQuery: action.bound,
      //computed
      workspaceSlug: computed,
      projectId: computed,
      cycleId: computed,
      moduleId: computed,
      viewId: computed,
      globalViewId: computed,
      profileViewId: computed,
      userId: computed,
      peekId: computed,
      issueId: computed,
      inboxId: computed,
      webhookId: computed,
    });
  }

  /**
   * Sets the query
   * @param query
   */
  setQuery = (query: ParsedUrlQuery) => {
    runInAction(() => {
      this.query = query;
    });
  };

  /**
   * Returns the workspace slug from the query
   * @returns string|undefined
   */
  get workspaceSlug() {
    return this.query?.workspaceSlug?.toString();
  }

  /**
   * Returns the project id from the query
   * @returns string|undefined
   */
  get projectId() {
    return this.query?.projectId?.toString();
  }

  /**
   * Returns the module id from the query
   * @returns string|undefined
   */
  get moduleId() {
    return this.query?.moduleId?.toString();
  }

  /**
   * Returns the cycle id from the query
   * @returns string|undefined
   */
  get cycleId() {
    return this.query?.cycleId?.toString();
  }

  /**
   * Returns the view id from the query
   * @returns string|undefined
   */
  get viewId() {
    return this.query?.viewId?.toString();
  }

  /**
   * Returns the global view id from the query
   * @returns string|undefined
   */
  get globalViewId() {
    return this.query?.globalViewId?.toString();
  }

  /**
   * Returns the profile view id from the query
   * @returns string|undefined
   */
  get profileViewId() {
    return this.query?.profileViewId?.toString() as TProfileViews;
  }

  /**
   * Returns the user id from the query
   * @returns string|undefined
   */
  get userId() {
    return this.query?.userId?.toString();
  }

  /**
   * Returns the peek id from the query
   * @returns string|undefined
   */
  get peekId() {
    return this.query?.peekId?.toString();
  }

  /**
   * Returns the issue id from the query
   * @returns string|undefined
   */
  get issueId() {
    return this.query?.issueId?.toString();
  }

  /**
   * Returns the inbox id from the query
   * @returns string|undefined
   */
  get inboxId() {
    return this.query?.inboxId?.toString();
  }

  /**
   * Returns the webhook id from the query
   * @returns string|undefined
   */
  get webhookId() {
    return this.query?.webhookId?.toString();
  }
}
