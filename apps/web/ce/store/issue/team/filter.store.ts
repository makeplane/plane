/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IProjectIssuesFilter } from "@/store/issue/project";
import { ProjectIssuesFilter } from "@/store/issue/project";
import type { IIssueRootStore } from "@/store/issue/root.store";

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors
export type ITeamIssuesFilter = IProjectIssuesFilter;

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors
export class TeamIssuesFilter extends ProjectIssuesFilter implements IProjectIssuesFilter {
  constructor(_rootStore: IIssueRootStore) {
    super(_rootStore);
  }
}
