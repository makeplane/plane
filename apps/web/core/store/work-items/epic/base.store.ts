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

import { makeObservable } from "mobx";
// plane imports
// store
import type { CoreRootStore } from "@/store/root.store";
import type { IUpdateStore } from "./updates/base.store";
import { UpdateStore } from "./updates/base.store";
import { EpicMetaStore } from "./meta.store";
import type { IEpicMetaStore } from "./meta.store";
import type { AdditionalEpicPermissionMeta, EpicPermissions } from "./permissions/root";
import { EpicPermissionsInstance } from "./permissions/root";

export interface IEpicBaseStore {
  updatesStore: IUpdateStore;
  epicMetaStore: IEpicMetaStore;
  permissions: EpicPermissions;
}

export class EpicBaseStore implements IEpicBaseStore {
  //store
  rootStore: CoreRootStore;
  updatesStore: IUpdateStore;
  epicMetaStore: IEpicMetaStore;
  permissions: EpicPermissions;

  constructor(public store: CoreRootStore) {
    makeObservable(this, {});
    // services
    this.rootStore = store;
    this.updatesStore = new UpdateStore();
    this.epicMetaStore = new EpicMetaStore();
    this.permissions = new EpicPermissionsInstance({
      can: store.permissionAccessStore.can,
      getEpicConditionContext: this.getEpicConditionContext.bind(this),
      getEpicCommentConditionContext: this.getEpicCommentConditionContext.bind(this),
      getEpicUpdateConditionContext: this.getEpicUpdateConditionContext.bind(this),
      getEpicUpdateCommentConditionContext: this.getEpicUpdateCommentConditionContext.bind(this),
      getEpicAdditionalMeta: this.getEpicAdditionalMeta.bind(this),
    });
  }

  private getEpicConditionContext(epicId: string): { creator: boolean } {
    const epic = this.rootStore.issue.issues.getIssueById(epicId);
    const currentUserId = this.rootStore.user.data?.id;
    return { creator: !!(epic?.created_by && currentUserId && epic.created_by === currentUserId) };
  }

  private getEpicCommentConditionContext(_epicId: string, commentId: string): { creator: boolean } {
    const comment = this.updatesStore.comments.getCommentById(commentId);
    const currentUserId = this.rootStore.user.data?.id;
    return { creator: !!(comment?.created_by && currentUserId && comment.created_by === currentUserId) };
  }

  private getEpicUpdateConditionContext(_epicId: string, updateId: string): { creator: boolean } {
    const update = this.updatesStore.getUpdateById(updateId);
    const currentUserId = this.rootStore.user.data?.id;
    return { creator: !!(update?.created_by && currentUserId && update.created_by === currentUserId) };
  }

  private getEpicUpdateCommentConditionContext(
    _epicId: string,
    _updateId: string,
    commentId: string
  ): { creator: boolean } {
    const comment = this.updatesStore.comments.getCommentById(commentId);
    const currentUserId = this.rootStore.user.data?.id;
    return { creator: !!(comment?.created_by && currentUserId && comment.created_by === currentUserId) };
  }

  private getEpicAdditionalMeta(epicId: string): AdditionalEpicPermissionMeta {
    const epic = this.rootStore.issue.issues.getIssueById(epicId);
    if (!epic) return { isArchived: false };
    return { isArchived: !!epic.archived_at };
  }
}
