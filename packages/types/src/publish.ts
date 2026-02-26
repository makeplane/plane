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

export type TProjectDetails = IProjectLite &
  Pick<IProject, "cover_image" | "cover_image_url" | "logo_props" | "description">;

export type TPublishSettings = {
  anchor: string | undefined;
  created_at: string | undefined;
  created_by: string | undefined;
  entity_identifier: string | undefined;
  entity_name: TPublishEntityType | undefined;
  id: string | undefined;
  inbox: unknown;
  installed_apps: string[];
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
