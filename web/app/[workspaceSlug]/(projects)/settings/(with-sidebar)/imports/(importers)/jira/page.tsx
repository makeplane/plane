"use client";

import { FC, Fragment, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane web components
import { DashboardLoaderRoot } from "@/plane-web/components/importers/common/dashboard";
import { AuthenticationRoot, StepsRoot, JiraDashboardRoot } from "@/plane-web/components/importers/jira";
//  plane web hooks
import { useFlag, useJiraImporter } from "@/plane-web/hooks/store";

const JiraImporter: FC = observer(() => {
  const {
    user,
    workspace,
    externalApiToken,
    fetchExternalApiToken,
    dashboardView,
    resetImporterData,
    auth: { currentAuth, authVerification },
    job: { workspaceId: serviceWorkspaceId, setDefaultServiceConfig },
  } = useJiraImporter();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const isFeatureEnabled = useFlag(workspaceSlug?.toString(), "JIRA_IMPORTER");

  // fetching external api token
  const { isLoading: externalApiTokenIsLoading } = useSWR(
    isFeatureEnabled && workspaceSlug && !externalApiToken ? `IMPORTER_EXTERNAL_SERVICE_TOKEN_${workspaceSlug}` : null,
    isFeatureEnabled && workspaceSlug && !externalApiToken ? async () => fetchExternalApiToken(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  // validating the importer is authenticated or not
  const { isLoading: importerAuthIsLoading } = useSWR(
    isFeatureEnabled && workspaceSlug && userId && externalApiToken && !currentAuth
      ? `IMPORTER_AUTHENTICATION_JIRA_${workspaceSlug}_${user?.id}`
      : null,
    isFeatureEnabled && workspaceSlug && userId && externalApiToken && !currentAuth
      ? async () => authVerification()
      : null,
    { errorRetryCount: 0 }
  );

  // initiating job service config
  useEffect(() => {
    if (workspaceId && workspaceSlug && userId && externalApiToken && workspaceId != serviceWorkspaceId) {
      setDefaultServiceConfig(workspaceId, externalApiToken);
    }
    return () => {
      resetImporterData();
    };
  }, [
    workspaceId,
    workspaceSlug,
    userId,
    externalApiToken,
    serviceWorkspaceId,
    setDefaultServiceConfig,
    resetImporterData,
  ]);

  if (!isFeatureEnabled) return null;

  if ((!externalApiToken && externalApiTokenIsLoading) || (!currentAuth && importerAuthIsLoading))
    return <DashboardLoaderRoot />;

  if (!externalApiToken || !currentAuth)
    return (
      <div className="text-custom-text-200 flex h-full justify-center items-center">
        Not able to access the external api token. Please try again later.
      </div>
    );

  return (
    <Fragment>
      {!currentAuth?.isAuthenticated ? (
        <AuthenticationRoot />
      ) : (
        <Fragment>{dashboardView ? <JiraDashboardRoot /> : <StepsRoot />}</Fragment>
      )}
    </Fragment>
  );
});

export default JiraImporter;
