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

import { action, computed, makeObservable, observable } from "mobx";
import type { IMilestoneInstance, TDescription, TMilestone, TMilestoneProgress } from "@plane/types";
import { getProgress } from "@plane/utils";

export class MilestoneInstance implements IMilestoneInstance {
  // observables
  id: string;
  title: string;
  description?: TDescription;
  target_date: string | null;
  project_id: string;
  workspace_id: string;
  progress: TMilestoneProgress;
  work_item_ids: string[];

  constructor(data: TMilestone, work_item_ids?: string[]) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.target_date = data.target_date;
    this.project_id = data.project_id;
    this.workspace_id = data.workspace_id;
    this.progress = data.progress;
    this.work_item_ids = work_item_ids || [];

    makeObservable(this, {
      // observables
      id: observable,
      title: observable,
      description: observable,
      target_date: observable,
      project_id: observable,
      workspace_id: observable,
      progress: observable,
      work_item_ids: observable,
      // computed
      progress_percentage: computed,
      // actions
      updateProgress: action,
      update: action,
    });
  }

  // computed
  get progress_percentage(): number {
    const { total_items, completed_items, cancelled_items } = this.progress;

    return getProgress(completed_items, total_items, cancelled_items);
  }

  // actions
  updateProgress: IMilestoneInstance["updateProgress"] = action((progress) => {
    this.progress = progress;
  });

  update: IMilestoneInstance["update"] = action((data) => {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.target_date !== undefined) this.target_date = data.target_date;
    if (data.progress !== undefined) this.progress = data.progress;
  });
}
