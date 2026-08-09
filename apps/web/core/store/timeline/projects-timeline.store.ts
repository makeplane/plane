/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { autorun } from "mobx";
import type { RootStore } from "@/store/root.store";
import { BaseTimeLineStore } from "@/store/timeline/base-timeline.store";
import type { IBaseTimelineStore } from "@/store/timeline/base-timeline.store";

export interface IProjectsTimeLineStore extends IBaseTimelineStore {}

/**
 * Timeline store that renders one Gantt block per project, spanning the
 * date range derived from that project's issues (min start_date -> max
 * target_date), since projects themselves don't carry their own dates.
 */
export class ProjectsTimeLineStore extends BaseTimeLineStore implements IProjectsTimeLineStore {
  constructor(_rootStore: RootStore) {
    super(_rootStore);

    autorun(() => {
      const projectStore = this.rootStore.projectRoot.project;

      const getProjectTimelineDataById = (projectId: string) => {
        const project = projectStore.getProjectById(projectId);
        if (!project) return null;

        const analytics = projectStore.getProjectAnalyticsCountById(projectId);

        return {
          id: project.id,
          name: project.name,
          sort_order: project.sort_order ?? null,
          start_date: analytics?.start_date ?? undefined,
          target_date: analytics?.target_date ?? undefined,
          project_id: project.id,
        };
      };

      this.updateBlocks(getProjectTimelineDataById);
    });
  }
}
