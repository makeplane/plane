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
import type { LinearConfig } from "@plane/etl/linear";
import type { TImportJob } from "@plane/types";
// assets
import LinearLogo from "@/app/assets/services/linear.svg?url";
// plane web imports
import { useLinearImporter } from "@/plane-web/hooks/store";
// components
import { BaseDashboard } from "../../common/dashboard/base-dashboard";

export const LinearDashboardRoot = observer(function LinearDashboardRoot() {
  const getWorkspaceName = (job: TImportJob<LinearConfig>) => job?.config?.workspaceDetail?.name || "---";
  const getProjectName = (job: TImportJob<LinearConfig>) =>
    job?.config?.teamDetail?.name || job?.config?.teamName || "---";
  const getPlaneProject = (job: TImportJob<LinearConfig>) => job?.config?.planeProject;

  return (
    <BaseDashboard
      config={{
        getWorkspaceName,
        getProjectName,
        getPlaneProject,
        serviceName: "Linear",
        logo: LinearLogo,
        swrKey: "LINEAR_IMPORTER",
      }}
      useImporterHook={useLinearImporter}
    />
  );
});
