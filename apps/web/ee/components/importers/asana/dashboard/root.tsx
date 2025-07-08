"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { AsanaConfig } from "@plane/etl/asana";
import { TImportJob } from "@plane/types";
import { useAsanaImporter } from "@/plane-web/hooks/store";
// assets
import AsanaLogo from "@/public/services/asana.svg";
// components
import { BaseDashboard } from "../../common/dashboard/base-dashboard";

export const AsanaDashboardRoot: FC = observer(() => {
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
