/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IProjectViewIssues } from "@/store/issue/project-views";
import { ProjectViewIssues } from "@/store/issue/project-views";
import type { IIssueRootStore } from "@/store/issue/root.store";
import type { ITeamViewIssuesFilter } from "./filter.store";

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors
export type ITeamViewIssues = IProjectViewIssues;

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors
export class TeamViewIssues extends ProjectViewIssues implements IProjectViewIssues {
  constructor(_rootStore: IIssueRootStore, teamViewFilterStore: ITeamViewIssuesFilter) {
    super(_rootStore, teamViewFilterStore);
  }
}
