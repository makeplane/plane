"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { JiraConfig } from "@plane/etl/jira";
import { TImportJob } from "@plane/types";
import { useJiraServerImporter } from "@/plane-web/hooks/store";
// assets
import JiraLogo from "@/public/services/jira.svg";
// components
import { BaseDashboard } from "../../common/dashboard/base-dashboard";

export const JiraServerDashboardRoot: FC = observer(() => {
  const getWorkspaceName = (job: TImportJob<JiraConfig>) => job.config.resource?.name || "---";
  const getProjectName = (job: TImportJob<JiraConfig>) => job.config.project?.name || "---";
  const getPlaneProject = (job: TImportJob<JiraConfig>) => job.config.planeProject;

  return (
    <BaseDashboard
      config={{
        getWorkspaceName,
        getProjectName,
        getPlaneProject,
        serviceName: "Jira Server",
        logo: JiraLogo,
        swrKey: "JIRA_SERVER_IMPORTER",
      }}
      useImporterHook={useJiraServerImporter}
    />
  );
});
