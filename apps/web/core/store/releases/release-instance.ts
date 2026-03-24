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

import { action, makeObservable, observable } from "mobx";
import type { Release, ReleaseWrite, TDocumentPayload } from "@plane/types";

type TReleaseInstanceHelpers = {
  update: (payload: ReleaseWrite) => Promise<Release>;
  addWorkItems: (workItemIds: string[]) => Promise<void>;
  removeWorkItems: (workItemIds: string[]) => Promise<void>;
  canEditWorkItemProperties: (projectId: string) => boolean;
};

export class ReleaseInstance implements Release {
  // release fields
  id: string;
  name: string;
  description: Partial<TDocumentPayload> | null | undefined;
  release_date: string | null;
  workspace_id: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  label_ids: string[];
  work_item_ids: string[];
  completed_work_item_count: number;
  cancelled_work_item_count: number;
  status: Release["status"];
  tag: string | null | undefined;
  lead: string | null | undefined;
  // helpers
  private helpers: TReleaseInstanceHelpers;

  constructor(release: Release, helpers: TReleaseInstanceHelpers) {
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
    this.helpers = helpers;

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
      mutateProperties: action,
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

  canEditWorkItemProperties = (projectId: string): boolean => this.helpers.canEditWorkItemProperties(projectId);

  update = async (payload: ReleaseWrite): Promise<Release> => this.helpers.update(payload);

  addWorkItems = async (workItemIds: string[]): Promise<void> => this.helpers.addWorkItems(workItemIds);

  removeWorkItems = async (workItemIds: string[]): Promise<void> => this.helpers.removeWorkItems(workItemIds);
}
