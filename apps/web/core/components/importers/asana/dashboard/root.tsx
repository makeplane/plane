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

import type { FC } from "react";
import { observer } from "mobx-react";
// hooks
import type { AsanaConfig } from "@plane/etl/asana";
import type { TImportJob } from "@plane/types";
// assets
import AsanaLogo from "@/app/assets/services/asana.svg";
// plane web imports
import { useAsanaImporter } from "@/plane-web/hooks/store";
import { BaseDashboard } from "../../common/dashboard/base-dashboard";

export const AsanaDashboardRoot = observer(function AsanaDashboardRoot() {
  const getWorkspaceName = (job: TImportJob<AsanaConfig>) => job.config.workspace?.name || "---";
  const getProjectName = (job: TImportJob<AsanaConfig>) => job.config.project?.name || "---";
  const getPlaneProject = (job: TImportJob<AsanaConfig>) => job.config.planeProject;

  return (
    <BaseDashboard
      config={{
        getWorkspaceName,
        getProjectName,
        getPlaneProject,
        serviceName: "Asana",
        logo: AsanaLogo,
        swrKey: "ASANA_IMPORTER",
      }}
      useImporterHook={useAsanaImporter}
    />
  );
});
