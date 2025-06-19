"use client";

import { FC, Fragment, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { DashboardLoaderRoot } from "@/plane-web/components/importers/common/dashboard";
import { NotionJobDashboard } from "@/plane-web/components/importers/notion/dashboard";
import { StepsRoot } from "@/plane-web/components/importers/notion/steps/root";
import { useFlag, useNotionImporter } from "@/plane-web/hooks/store";

const NotionImporter: FC = observer(() => {
  const {
    // Properties
    workspace,
    user,
    externalApiToken,
    dashboardView,

    // Actions
    fetchProjects,
    fetchExternalApiToken,
    verifyAndAddCredentials,
    resetImporterData,
    job: { workspaceId: serviceWorkspaceId, setDefaultServiceConfig },
  } = useNotionImporter();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;

  const isFeatureEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.NOTION_IMPORTER) || false;

  // fetching external api token
  const { isLoading: externalApiTokenIsLoading, error: externalApiTokenError } = useSWR(
    workspaceSlug && !externalApiToken ? `IMPORTER_EXTERNAL_SERVICE_TOKEN_${workspaceSlug}` : null,
    workspaceSlug && !externalApiToken ? async () => fetchExternalApiToken(workspaceSlug) : null,
    { revalidateOnFocus: false, errorRetryCount: 0 }
  );

  // Save Credentials
  const { isLoading: verifyCredentialsLoading } = useSWR(
    workspaceId && userId && externalApiToken ? `CHECKING_AND_SAVING_CREDENTIALS_${workspaceSlug}` : null,
    workspaceId && userId && externalApiToken
      ? async () => verifyAndAddCredentials(workspaceId, userId, externalApiToken)
      : null,
    { revalidateOnFocus: false, errorRetryCount: 0 }
  );

  // Load Projects
  const { isLoading: isProjectsLoading } = useSWR(
    workspaceSlug ? `IMPORTERS_PLANE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? async () => fetchProjects(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  // reset importer data
  useEffect(() => {
    if (workspaceId && userId && externalApiToken && workspaceId != serviceWorkspaceId) {
      setDefaultServiceConfig(workspaceId, externalApiToken);
    }
    return () => {
      resetImporterData();
    };
  }, [workspaceId, userId, externalApiToken, serviceWorkspaceId, setDefaultServiceConfig, resetImporterData]);

  if (!isFeatureEnabled)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        <div className="flex flex-col items-center justify-center">
          <div className="text-custom-text-200 text-2xl font-medium">Notion Importer is not enabled</div>
        </div>
      </div>
    );

  if (externalApiTokenIsLoading || verifyCredentialsLoading || isProjectsLoading) {
    return <DashboardLoaderRoot />;
  }

  if (externalApiTokenError) {
    return (
      <div className="text-custom-text-300 flex h-full justify-center items-center">
        {externalApiTokenError?.message}
      </div>
    );
  }

  if (!externalApiToken)
    return (
      <div className="text-custom-text-200 flex h-full justify-center items-center">
        Not able to access the external api token. Please try again later.
      </div>
    );

  return <Fragment>{dashboardView ? <NotionJobDashboard /> : <StepsRoot />}</Fragment>;
});

export default NotionImporter;
