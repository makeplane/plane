/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Params } from "react-router";
import { action, makeObservable, observable, computed, runInAction } from "mobx";

import type { TProfileViews } from "@plane/types";
export interface IRouterStore {
  // observables
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  query: Params;
  // actions
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  setQuery: (query: Params) => void;
  // computed
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  workspaceSlug: string | undefined;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  teamspaceId: string | undefined;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  projectId: string | undefined;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  cycleId: string | undefined;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  moduleId: string | undefined;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  viewId: string | undefined;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  globalViewId: string | undefined;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  profileViewId: TProfileViews | undefined;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  userId: string | undefined;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  peekId: string | undefined;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  issueId: string | undefined;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  inboxId: string | undefined;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  webhookId: string | undefined;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  epicId: string | undefined;
}

export class RouterStore implements IRouterStore {
  // observables
  query: Params = {};

  constructor() {
    makeObservable(this, {
      // observables
      query: observable,
      // actions
      setQuery: action.bound,
      //computed
      workspaceSlug: computed,
      teamspaceId: computed,
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
      epicId: computed,
    });
  }

  /**
   * Sets the query
   * @param query
   */
  setQuery = (query: Params) => {
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
   * Returns the teamspace id from the query
   * @returns string|undefined
   */
  get teamspaceId() {
    return this.query?.teamspaceId?.toString();
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

  /**
   * Returns the epic id from the query
   * @returns string|undefined
   */
  get epicId() {
    return this.query?.epicId?.toString();
  }
}
