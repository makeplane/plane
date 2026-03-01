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

import { Fragment, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { DashboardLoaderRoot } from "@/components/importers/common/dashboard";
import { CSVDashboardRoot } from "@/components/importers/csv/dashboard";
import { CSVStepsRoot } from "@/components/importers/csv/steps";
// hooks
import { useCSVImporter } from "@/plane-web/hooks/store";

/**
 * CSV Work Item Importer page.
 * Allows users to upload CSV files and import work items into a project.
 */
const CSVWorkItemImporter = observer(function CSVWorkItemImporter() {
  const {
    // Properties
    workspace,
    user,
    externalApiToken,
    dashboardView,
    // Actions
    fetchProjects,
    resetImporterData,
    job: { workspaceId: serviceWorkspaceId, setDefaultServiceConfig },
  } = useCSVImporter();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;

  // Load Projects
  const { isLoading: isProjectsLoading } = useSWR(
    workspaceSlug ? `CSV_IMPORTERS_PLANE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchProjects(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  // Configure job store when external API token is available
  useEffect(() => {
    if (workspaceId && userId && workspaceId !== serviceWorkspaceId) {
      setDefaultServiceConfig(workspaceId, "");
    }
    return () => {
      resetImporterData();
    };
  }, [workspaceId, userId, externalApiToken, serviceWorkspaceId, setDefaultServiceConfig, resetImporterData]);

  if (isProjectsLoading) {
    return <DashboardLoaderRoot />;
  }

  return <Fragment>{dashboardView ? <CSVDashboardRoot /> : <CSVStepsRoot />}</Fragment>;
});

export default CSVWorkItemImporter;
