"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { TClickUpConfig } from "@plane/etl/clickup";
import { TImportJob } from "@plane/types";
import { useClickUpImporter } from "@/plane-web/hooks/store";
// assets
import ClickUpLogo from "@/public/services/clickup.svg";
// components
import { BaseDashboard } from "../../common/dashboard/base-dashboard";

export const ClickUpDashboardRoot: FC = observer(() => {
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
