"use client";

import { FC, Fragment, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane web components
import {
  AuthenticationRoot,
  Dashboard,
  StepsRoot,
  DashboardLoaderRoot,
} from "@/plane-web/components/importers/jira-server";
//  plane web hooks
import { useFlag, useJiraServerImporter } from "@/plane-web/hooks/store";
// plane web types
import { E_FEATURE_FLAGS } from "@/plane-web/types/feature-flag";

const JiraServerImporter: FC = observer(() => {
  const {
    user,
    workspace,
    externalApiToken,
    fetchExternalApiToken,
    dashboardView,
    resetImporterData,
    auth: { currentAuth, authVerification },
    job: { workspaceId: serviceWorkspaceId, setDefaultServiceConfig },
  } = useJiraServerImporter();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const isFeatureEnabled =
    (workspaceSlug && useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.JIRA_SERVER_IMPORTER)) || false;

  // fetching external api token
  const { isLoading: externalApiTokenIsLoading } = useSWR(
    isFeatureEnabled && workspaceSlug && !externalApiToken
      ? `IMPORTER_JIRA_SERVER_EXTERNAL_SERVICE_TOKEN_${workspaceSlug}`
      : null,
    isFeatureEnabled && workspaceSlug && !externalApiToken ? async () => fetchExternalApiToken(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  // validating the importer is authenticated or not
  const { isLoading: importerAuthIsLoading } = useSWR(
    isFeatureEnabled && workspaceSlug && userId && externalApiToken && !currentAuth
      ? `IMPORTER_AUTHENTICATION_JIRA_SERVER_${workspaceSlug}_${user?.id}`
      : null,
    isFeatureEnabled && workspaceSlug && userId && externalApiToken && !currentAuth
      ? async () => authVerification()
      : null,
    { errorRetryCount: 0 }
  );

  // initiating job service config
  useEffect(() => {
    if (workspaceId && userId && externalApiToken && workspaceId != serviceWorkspaceId) {
      setDefaultServiceConfig(workspaceId, externalApiToken);
    }
    return () => {
      resetImporterData();
    };
  }, [workspaceId, userId, externalApiToken, serviceWorkspaceId, setDefaultServiceConfig, resetImporterData]);

  if (!isFeatureEnabled) return null;

  if ((!externalApiToken && externalApiTokenIsLoading) || (!currentAuth && importerAuthIsLoading))
    return <DashboardLoaderRoot />;

  if (!externalApiToken || !currentAuth)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        Not able to access the external api token. Please try again later.
      </div>
    );

  return (
    <Fragment>
      {!currentAuth?.isAuthenticated ? (
        <AuthenticationRoot />
      ) : (
        <Fragment>{dashboardView ? <Dashboard /> : <StepsRoot />}</Fragment>
      )}
    </Fragment>
  );
});

export default JiraServerImporter;
