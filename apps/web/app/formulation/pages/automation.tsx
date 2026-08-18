/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Navigate, useParams, useSearchParams } from "react-router";

export default function RedirectToFormulationApiOrPage() {
  const { workspaceSlug, projectId } = useParams();
  const [searchParams] = useSearchParams();
  const dest =
    searchParams.get("tab") === "pages"
      ? `/${workspaceSlug}/projects/${projectId}/formulation/page`
      : `/${workspaceSlug}/projects/${projectId}/formulation/api`;
  return <Navigate to={dest} replace />;
}
