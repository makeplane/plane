/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TEpicAnalyticsGroup } from "@plane/types";

export const updateEpicAnalytics = () => {
  const updateAnalytics = (
    workspaceSlug: string,
    projectId: string,
    epicId: string,
    data: {
      incrementStateGroupCount?: TEpicAnalyticsGroup;
      decrementStateGroupCount?: TEpicAnalyticsGroup;
    }
  ) => {};

  return { updateAnalytics };
};
