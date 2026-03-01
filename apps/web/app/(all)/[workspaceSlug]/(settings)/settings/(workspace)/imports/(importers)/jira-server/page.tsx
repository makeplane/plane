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

import { Fragment, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane web components
import { DashboardLoaderRoot } from "@/components/importers/common/dashboard";
import { AuthenticationRoot, JiraServerDashboardRoot, StepsRoot } from "@/components/importers/jira-server";
//  plane web hooks
import { useJiraServerImporter } from "@/plane-web/hooks/store";

function JiraServerImporter() {
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

  // fetching external api token
  const { isLoading: externalApiTokenIsLoading } = useSWR(
    workspaceSlug && !externalApiToken ? `IMPORTER_JIRA_SERVER_EXTERNAL_SERVICE_TOKEN_${workspaceSlug}` : null,
    workspaceSlug && !externalApiToken ? async () => fetchExternalApiToken(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  // validating the importer is authenticated or not
  const { isLoading: importerAuthIsLoading } = useSWR(
    workspaceSlug && userId && externalApiToken && !currentAuth
      ? `IMPORTER_AUTHENTICATION_JIRA_SERVER_${workspaceSlug}_${user?.id}`
      : null,
    workspaceSlug && userId && externalApiToken && !currentAuth ? async () => authVerification() : null,
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
    userId,
    externalApiToken,
    serviceWorkspaceId,
    setDefaultServiceConfig,
    resetImporterData,
    workspaceSlug,
  ]);

  if ((!externalApiToken && externalApiTokenIsLoading) || (!currentAuth && importerAuthIsLoading))
    return <DashboardLoaderRoot />;

  if (!externalApiToken || !currentAuth)
    return (
      <div className="text-secondary relative flex justify-center items-center">
        Not able to access the external api token. Please try again later.
      </div>
    );

  return (
    <Fragment>
      {!currentAuth?.isAuthenticated ? (
        <AuthenticationRoot />
      ) : (
        <Fragment>{dashboardView ? <JiraServerDashboardRoot /> : <StepsRoot />}</Fragment>
      )}
    </Fragment>
  );
}

export default observer(JiraServerImporter);
