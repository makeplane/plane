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

import { makeObservable, observable } from "mobx";
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
  // observables
  memberMap: Record<string, IUserLite>;
  // computed actions
  getMemberIds: () => string[];
  getUserDetails: (userId: string) => IUserLite | undefined;
  // sub-stores
  workspace: IWorkspaceMemberStore;
  project: IProjectMemberStore;
}

export class MemberRootStore implements IMemberRootStore {
  // observables
  memberMap: Record<string, IUserLite> = {};
  // sub-stores
  workspace: IWorkspaceMemberStore;
  project: IProjectMemberStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      memberMap: observable,
    });
    // sub-stores
    this.workspace = new WorkspaceMemberStore(this, _rootStore);
    this.project = new ProjectMemberStore(this, _rootStore);
  }

  /**
   * @description get all member ids
   */
  getMemberIds = computedFn(() => Object.keys(this.memberMap));

  /**
   * @description get user details from userId
   * @param userId
   */
  getUserDetails = computedFn((userId: string): IUserLite | undefined => this.memberMap?.[userId] ?? undefined);
}
