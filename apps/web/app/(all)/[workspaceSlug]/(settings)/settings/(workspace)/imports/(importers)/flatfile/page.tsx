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
import { DashboardLoaderRoot } from "@/components/importers/common/dashboard";
import { FlatfileDashboardRoot } from "@/components/importers/flatfile";
import { StepsRoot } from "@/components/importers/flatfile/steps";
import { useFlatfileImporter } from "@/plane-web/hooks/store";

function FlatfileImporter() {
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
  } = useFlatfileImporter();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;

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

  if (externalApiTokenIsLoading || verifyCredentialsLoading || isProjectsLoading) {
    return <DashboardLoaderRoot />;
  }

  if (externalApiTokenError) {
    return (
      <div className="text-tertiary flex h-full justify-center items-center">{externalApiTokenError?.message}</div>
    );
  }

  if (!externalApiToken)
    return (
      <div className="text-secondary flex h-full justify-center items-center">
        Not able to access the external api token. Please try again later.
      </div>
    );

  return <Fragment>{dashboardView ? <FlatfileDashboardRoot /> : <StepsRoot />}</Fragment>;
}

export default observer(FlatfileImporter);
