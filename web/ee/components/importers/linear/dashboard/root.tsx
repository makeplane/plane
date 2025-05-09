"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { LinearConfig } from "@plane/etl/linear";
import { TImportJob } from "@plane/types";
import { useLinearImporter } from "@/plane-web/hooks/store";
// assets
import LinearLogo from "@/public/services/linear.svg";
// components
import { BaseDashboard } from "../../common/dashboard/base-dashboard";

export const LinearDashboardRoot: FC = observer(() => {
  const getWorkspaceName = (job: TImportJob<LinearConfig>) => job?.config?.workspaceDetail?.name || "---";
  const getProjectName = (job: TImportJob<LinearConfig>) => job?.config?.teamDetail?.name || job?.config?.teamName || "---";
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
