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

import { observer } from "mobx-react";
// types
import type { TImportJob } from "@plane/types";
// assets
import CSVLogo from "@/app/assets/services/csv.svg?url";
// plane web imports
import { useCSVImporter } from "@/plane-web/hooks/store";
// components
import { BaseDashboard } from "@/components/importers/common/dashboard/base-dashboard";

/**
 * Dashboard root for CSV importer.
 * Uses BaseDashboard to show import job history.
 */
export const CSVDashboardRoot = observer(function CSVDashboardRoot() {
  const { getProjectById } = useCSVImporter();

  const getWorkspaceName = (_job: TImportJob<object>) => "---";
  const getProjectName = (_job: TImportJob<object>) => "---";
  const getPlaneProject = (job: TImportJob<object>) => {
    if (job.project_id) {
      return getProjectById(job.project_id);
    }
    return undefined;
  };

  return (
    <BaseDashboard<object>
      config={{
        getWorkspaceName,
        getProjectName,
        getPlaneProject,
        serviceName: "CSV Importer",
        logo: CSVLogo,
        swrKey: "CSV_IMPORTER",
        hideWorkspace: true,
        hideProject: true,
        hideDeactivate: true,
        hideBatches: true,
        hideRerun: true,
        hideCancel: true,
        showSummary: true,
        useReportForSummary: true,
      }}
      useImporterHook={useCSVImporter}
    />
  );
});
