/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { EIssueServiceType } from "@plane/types";
import type { IProjectIssues } from "@/store/issue/project";
import { ProjectIssues } from "@/store/issue/project";
import type { IIssueRootStore } from "@/store/issue/root.store";
import type { IProjectEpicsFilter } from "./filter.store";

export type IProjectEpics = IProjectIssues;

/**
 * Store for the project-level epics list.
 * Same behavior as the project work items store, but every network call is
 * routed to the /epics/ endpoints (EIssueServiceType.EPICS): the backend
 * annotates the list, forces the epic type on create and rejects parents.
 *
 * NOTE: epics cannot be archived server-side (no /epics/:id/archive/ route) —
 * the epic UI never calls `archiveIssue` (no Archive quick action for epics).
 */
export class ProjectEpics extends ProjectIssues implements IProjectEpics {
  constructor(_rootStore: IIssueRootStore, issueFilterStore: IProjectEpicsFilter) {
    super(_rootStore, issueFilterStore, EIssueServiceType.EPICS);
  }
}
