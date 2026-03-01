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
import type { TClickUpConfig } from "@plane/etl/clickup";
import type { TImportJob } from "@plane/types";
// assets
import ClickUpLogo from "@/app/assets/services/clickup.svg?url";
// plane web imports
import { useClickUpImporter } from "@/plane-web/hooks/store";
// components
import { BaseDashboard } from "../../common/dashboard/base-dashboard";

export const ClickUpDashboardRoot = observer(function ClickUpDashboardRoot() {
  const getWorkspaceName = (job: TImportJob<TClickUpConfig>) => job?.config?.space?.name || "---";
  const getProjectName = (job: TImportJob<TClickUpConfig>) => job?.config?.folder?.name || "---";
  const getPlaneProject = (job: TImportJob<TClickUpConfig>) => job?.config?.planeProject;

  return (
    <BaseDashboard
      config={{
        getWorkspaceName,
        getProjectName,
        getPlaneProject,
        serviceName: "ClickUp",
        logo: ClickUpLogo,
        swrKey: "CLICKUP_IMPORTER",
      }}
      useImporterHook={useClickUpImporter}
    />
  );
});
