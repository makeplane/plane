/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TProjectLinkEditableFields = {
  title: string;
  url: string;
};

export type TProjectLink = TProjectLinkEditableFields & {
  created_by_id: string;
  id: string;
  metadata: any;
  project_id: string;

  //need
  created_at: Date;
};

export type TProjectLinkMap = {
  [project_id: string]: TProjectLink;
};

export type TProjectLinkIdMap = {
  [project_id: string]: string[];
};
