"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { FlatfileConfig } from "@plane/etl/flatfile";
import { TImportJob } from "@plane/types";
import { useFlatfileImporter } from "@/plane-web/hooks/store";
// assets
import CSVLogo from "@/public/services/csv.svg";
// components
import { BaseDashboard } from "../../common/dashboard/base-dashboard";

export const FlatfileDashboardRoot: FC = observer(() => {
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
