/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IProject, IProjectLite } from "./project";
import type { IWorkspaceLite } from "./workspace";

export type TPublishEntityType = "project" | "page";

export type TProjectPublishLayouts = "calendar" | "gantt" | "kanban" | "list" | "spreadsheet";

export type TProjectPublishViewProps = {
  calendar?: boolean;
  gantt?: boolean;
  kanban?: boolean;
  list?: boolean;
  spreadsheet?: boolean;
};

export type TProjectDetails = IProjectLite & Pick<IProject, "cover_image" | "logo_props" | "description">;

export type TPublishSettings = {
  anchor: string | undefined;
  created_at: string | undefined;
  created_by: string | undefined;
  entity_identifier: string | undefined;
  entity_name: TPublishEntityType | undefined;
  id: string | undefined;
  inbox: unknown;
  is_comments_enabled: boolean;
  is_reactions_enabled: boolean;
  is_votes_enabled: boolean;
  project: string | undefined;
  project_details: TProjectDetails | undefined;
  updated_at: string | undefined;
  updated_by: string | undefined;
  workspace: string | undefined;
  workspace_detail: IWorkspaceLite | undefined;
};

export type TProjectPublishSettings = TPublishSettings & {
  view_props: TProjectPublishViewProps | undefined;
};
