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

import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { IUserLite } from "@plane/types";
// store
import type { IProjectMemberStore } from "./project/membership.store";
import { ProjectMemberStore } from "./project/membership.store";
import type { IWorkspaceMemberStore } from "./workspace/membership.store";
import { WorkspaceMemberStore } from "./workspace/membership.store";
import type { RootStore } from "@/plane-web/store/root.store";

export interface IMemberRootStore {
  // computed
  userIds: string[];
  users: IUserLite[];
  // computed actions
  getUserDetails: (userId: string) => IUserLite | undefined;
  // actions
  addOrUpdateUser: (user: IUserLite) => void;
  // sub-stores
  workspace: IWorkspaceMemberStore;
  project: IProjectMemberStore;
}

export class MemberRootStore implements IMemberRootStore {
  // observables
  private userMap: Map<string, IUserLite> = new Map();
  // sub-stores
  workspace: IWorkspaceMemberStore;
  project: IProjectMemberStore;

  constructor(_rootStore: RootStore) {
    makeObservable<MemberRootStore, "userMap">(this, {
      // observables
      userMap: observable,
      // actions
      addOrUpdateUser: action,
    });
    // sub-stores
    this.workspace = new WorkspaceMemberStore(this, _rootStore);
    this.project = new ProjectMemberStore(this, _rootStore);
  }

  /**
   * @description get all member ids
   */
  get userIds() {
    return Array.from(this.userMap.keys());
  }

  get users() {
    return Array.from(this.userMap.values());
  }

  /**
   * @description get user details from userId
   * @param userId
   */
  getUserDetails: IMemberRootStore["getUserDetails"] = computedFn((userId) => this.userMap.get(userId));

  /**
   * @description add or update user details
   * @param user
   */
  addOrUpdateUser: IMemberRootStore["addOrUpdateUser"] = action((user) => {
    runInAction(() => {
      const prevUser = this.userMap.get(user.id);
      this.userMap.set(user.id, {
        ...(prevUser ?? {}),
        ...user,
      });
    });
  });
}
