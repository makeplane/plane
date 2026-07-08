/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Navigate } from "react-router";
// components
import { PageHead } from "@/components/core/page-title";
import { FileLibraryRoot } from "@/components/file-library/root";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

const FileLibraryPage = observer(function FileLibraryPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  // store hooks
  const { isWorkspaceFeatureEnabled, featureFlagsMap } = useWorkspace();
  // derived values
  const areFlagsLoaded = featureFlagsMap[workspaceSlug] !== undefined;
  const isFileLibraryEnabled = isWorkspaceFeatureEnabled(workspaceSlug, "file_library");

  // Redirect home when the module is disabled for this workspace
  if (areFlagsLoaded && !isFileLibraryEnabled) return <Navigate to={`/${workspaceSlug}`} replace />;

  return (
    <>
      <PageHead title="Library" />
      <div className="relative h-full w-full overflow-hidden">
        <FileLibraryRoot workspaceSlug={workspaceSlug} />
      </div>
    </>
  );
});

export default FileLibraryPage;
