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
// hooks
import type { FlatfileConfig } from "@plane/etl/flatfile";
import type { TImportJob } from "@plane/types";
// assets
import CSVLogo from "@/app/assets/services/csv.svg?url";
// plane web imports
import { useFlatfileImporter } from "@/plane-web/hooks/store";
// components
import { BaseDashboard } from "../../common/dashboard/base-dashboard";

export const FlatfileDashboardRoot = observer(function FlatfileDashboardRoot() {
  const { getProjectById } = useFlatfileImporter();

  const getWorkspaceName = (job: TImportJob<FlatfileConfig>) => job.config.workbookId || "---";
  const getProjectName = (job: TImportJob<FlatfileConfig>) => "---";
  const getPlaneProject = (job: TImportJob<FlatfileConfig>) => {
    if (job.project_id) {
      return getProjectById(job.project_id);
    }
  };

  return (
    <BaseDashboard
      config={{
        getWorkspaceName,
        getProjectName,
        getPlaneProject,
        serviceName: "CSV Importer",
        logo: CSVLogo,
        swrKey: "FLATFILE_IMPORTER",
        hideWorkspace: true,
        hideProject: true,
        hideDeactivate: true,
      }}
      useImporterHook={useFlatfileImporter}
    />
  );
});
