/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RootStore } from "@/store/root.store";
import { IssuesTimeLineStore } from "@/store/timeline/issues-timeline.store";
import type { IIssuesTimeLineStore } from "@/store/timeline/issues-timeline.store";
import { ModulesTimeLineStore } from "@/store/timeline/modules-timeline.store";
import type { IModulesTimeLineStore } from "@/store/timeline/modules-timeline.store";
import { ProjectsTimeLineStore } from "@/store/timeline/projects-timeline.store";
import type { IProjectsTimeLineStore } from "@/store/timeline/projects-timeline.store";
import { BaseTimeLineStore } from "./base-timeline.store";
import type { IBaseTimelineStore } from "./base-timeline.store";

export interface ITimelineStore {
  issuesTimeLineStore: IIssuesTimeLineStore;
  modulesTimeLineStore: IModulesTimeLineStore;
  projectTimeLineStore: IProjectsTimeLineStore;
  groupedTimeLineStore: IBaseTimelineStore;
}

export class TimeLineStore implements ITimelineStore {
  issuesTimeLineStore: IIssuesTimeLineStore;
  modulesTimeLineStore: IModulesTimeLineStore;
  projectTimeLineStore: IProjectsTimeLineStore;
  groupedTimeLineStore: IBaseTimelineStore;

  constructor(rootStore: RootStore) {
    this.issuesTimeLineStore = new IssuesTimeLineStore(rootStore);
    this.modulesTimeLineStore = new ModulesTimeLineStore(rootStore);
    this.projectTimeLineStore = new ProjectsTimeLineStore(rootStore);
    // Dummy store
    this.groupedTimeLineStore = new BaseTimeLineStore(rootStore);
  }
}
