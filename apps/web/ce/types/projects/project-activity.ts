/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TProjectBaseActivity } from "@plane/types";

export type TProjectActivity = TProjectBaseActivity & {
  content: string;
  userId: string;
  projectId: string;

  actor_detail: {
    display_name: string;
    id: string;
  };
  workspace_detail: {
    slug: string;
  };
  project_detail: {
    name: string;
  };

  createdAt: string;
  updatedAt: string;
};
