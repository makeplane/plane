/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Navigate, useParams } from "react-router";

/**
 * Compatibility redirect for bookmarked dashboard links. The aggregate now
 * lives on the single research overview page.
 */
function WorkspaceResearchDashboardPage() {
  const { workspaceSlug } = useParams();
  if (!workspaceSlug) return null;

  return <Navigate to={`/${workspaceSlug}/research`} replace />;
}

export default WorkspaceResearchDashboardPage;
