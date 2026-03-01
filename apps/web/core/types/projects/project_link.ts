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
