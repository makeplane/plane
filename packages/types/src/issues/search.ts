/*
 * SPDX-FileCopyrightText: 2026 Plane Software, Inc.
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

// local imports
import type { TIssue } from "./issue";
import type { IProject } from "../project";
import type { IState } from "../state";

export type TWorkItemRelationsSearchResponse = Pick<
  TIssue,
  "id" | "name" | "type_id" | "sequence_id" | "start_date"
> & {
  project: Pick<IProject, "id" | "name" | "identifier">;
  state: Pick<IState, "name" | "group" | "color">;
  workspace_slug: string;
};

export type TWorkItemRelationsSearchRequestParams = {
  search: string;
  project_id?: string;
  type_id?: string;
  workitem_id?: string;
};
