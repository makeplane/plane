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

import { action, computed, makeObservable, observable, runInAction } from "mobx";
import type { Release, ReleaseChangelog, ReleaseWrite } from "@plane/types";
import { computedFn } from "mobx-utils";

type ReleaseInstanceHelpers = {
  update: (payload: ReleaseWrite) => Promise<Release>;
  addWorkItems: (workItemIds: string[]) => Promise<void>;
  removeWorkItems: (workItemIds: string[]) => Promise<void>;
  changelog: {
    fetch: () => Promise<ReleaseChangelog>;
    update: (data: ReleaseChangelog["changelog"]) => Promise<ReleaseChangelog>;
  };
  permissions: {
    canEditWorkItemProperties: (projectId: string) => boolean;
    canEditChangelog: boolean;
  };
};

type ReleaseInstanceSchema = Release & {
  // permissions
  canEditWorkItemProperties: (projectId: string) => boolean;
  canEditChangelog: boolean;
  // actions
  mutateProperties: (data: Partial<Release>) => void;
  update: (payload: ReleaseWrite) => Promise<Release>;
  addWorkItems: (workItemIds: string[]) => Promise<void>;
  removeWorkItems: (workItemIds: string[]) => Promise<void>;
  // changelog
  changelog: ReleaseChangelog["changelog"] | undefined;
  fetchChangelog: () => Promise<ReleaseChangelog>;
  updateChangelog: (data: ReleaseChangelog["changelog"]) => Promise<ReleaseChangelog>;
};

export class ReleaseInstance implements ReleaseInstanceSchema {
  // release fields
  id: ReleaseInstanceSchema["id"];
  name: ReleaseInstanceSchema["name"];
  description: ReleaseInstanceSchema["description"];
  release_date: ReleaseInstanceSchema["release_date"];
  workspace_id: ReleaseInstanceSchema["workspace_id"];
  created_by: ReleaseInstanceSchema["created_by"];
  updated_by: ReleaseInstanceSchema["updated_by"];
  created_at: ReleaseInstanceSchema["created_at"];
  updated_at: ReleaseInstanceSchema["updated_at"];
  label_ids: ReleaseInstanceSchema["label_ids"];
  work_item_ids: ReleaseInstanceSchema["work_item_ids"];
  completed_work_item_count: ReleaseInstanceSchema["completed_work_item_count"];
  cancelled_work_item_count: ReleaseInstanceSchema["cancelled_work_item_count"];
  status: ReleaseInstanceSchema["status"];
  tag: ReleaseInstanceSchema["tag"];
  lead: ReleaseInstanceSchema["lead"];
  // changelog
  changelog: ReleaseInstanceSchema["changelog"];
  // helpers
  #helpers: ReleaseInstanceHelpers;

  constructor(release: Release, helpers: ReleaseInstanceHelpers) {
    this.id = release.id;
    this.name = release.name;
    this.description = release.description;
    this.release_date = release.release_date;
    this.workspace_id = release.workspace_id;
    this.created_by = release.created_by;
    this.updated_by = release.updated_by;
    this.created_at = release.created_at;
    this.updated_at = release.updated_at;
    this.label_ids = release.label_ids;
    this.work_item_ids = release.work_item_ids;
    this.completed_work_item_count = release.completed_work_item_count;
    this.cancelled_work_item_count = release.cancelled_work_item_count;
    this.status = release.status;
    this.tag = release.tag;
    this.lead = release.lead;
    this.#helpers = helpers;

    makeObservable(this, {
      name: observable.ref,
      description: observable,
      release_date: observable.ref,
      label_ids: observable,
      work_item_ids: observable,
      completed_work_item_count: observable.ref,
      cancelled_work_item_count: observable.ref,
      status: observable.ref,
      tag: observable.ref,
      lead: observable.ref,
      changelog: observable,
      // computed
      canEditChangelog: computed,
      // actions
      mutateProperties: action,
      update: action,
      addWorkItems: action,
      removeWorkItems: action,
      fetchChangelog: action,
      updateChangelog: action,
    });
  }

  mutateProperties = (data: Partial<Release>): void => {
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;
    if (data.release_date !== undefined) this.release_date = data.release_date;
    if (data.label_ids !== undefined) this.label_ids = data.label_ids;
    if (data.work_item_ids !== undefined) this.work_item_ids = data.work_item_ids;
    if (data.completed_work_item_count !== undefined) this.completed_work_item_count = data.completed_work_item_count;
    if (data.cancelled_work_item_count !== undefined) this.cancelled_work_item_count = data.cancelled_work_item_count;
    if (data.status !== undefined) this.status = data.status;
    if (data.tag !== undefined) this.tag = data.tag;
    if (data.lead !== undefined) this.lead = data.lead;
  };

  canEditWorkItemProperties: ReleaseInstanceSchema["canEditWorkItemProperties"] = computedFn(
    (projectId: string): boolean => this.#helpers.permissions.canEditWorkItemProperties(projectId)
  );

  get canEditChangelog(): ReleaseInstanceSchema["canEditChangelog"] {
    return this.#helpers.permissions.canEditChangelog;
  }

  update: ReleaseInstanceSchema["update"] = async (payload) => this.#helpers.update(payload);

  addWorkItems: ReleaseInstanceSchema["addWorkItems"] = async (workItemIds) => this.#helpers.addWorkItems(workItemIds);

  removeWorkItems: ReleaseInstanceSchema["removeWorkItems"] = async (workItemIds) =>
    this.#helpers.removeWorkItems(workItemIds);

  // changelog actions
  fetchChangelog: ReleaseInstanceSchema["fetchChangelog"] = async () => {
    try {
      const changelog = await this.#helpers.changelog.fetch();
      runInAction(() => {
        this.changelog = changelog.changelog;
      });
      return changelog;
    } catch (error) {
      console.error("Error in fetching changelog:", error);
      runInAction(() => {
        this.changelog = undefined;
      });
      throw error;
    }
  };

  updateChangelog: ReleaseInstanceSchema["updateChangelog"] = async (data) => {
    try {
      const updatedChangelog = await this.#helpers.changelog.update(data);
      runInAction(() => {
        this.changelog = updatedChangelog.changelog;
      });
      return updatedChangelog;
    } catch (error) {
      console.error("Error in updating changelog:", error);
      throw error;
    }
  };
}
