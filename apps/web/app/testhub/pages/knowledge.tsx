/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Navigate, useParams } from "react-router";

export default function RedirectToEnvironmentSchema() {
  const { workspaceSlug, projectId } = useParams();
  return <Navigate to={`/${workspaceSlug}/projects/${projectId}/environments/schema`} replace />;
}
