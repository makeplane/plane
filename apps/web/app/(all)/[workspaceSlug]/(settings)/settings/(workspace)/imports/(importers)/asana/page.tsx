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
import { AuthenticationRoot, StepsRoot } from "@/components/importers/asana";
//  plane web hooks
import { AsanaDashboardRoot } from "@/components/importers/asana/dashboard/root";
import { DashboardLoaderRoot } from "@/components/importers/common/dashboard";
import { useAsanaImporter } from "@/plane-web/hooks/store";

function AsanaImporter() {
  const {
    user,
    workspace,
    externalApiToken,
    fetchExternalApiToken,
    dashboardView,
    resetImporterData,
    auth: { currentAuth, authVerification },
    job: { workspaceId: serviceWorkspaceId, setDefaultServiceConfig },
  } = useAsanaImporter();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;

  // fetching external api token
  const { isLoading: externalApiTokenIsLoading } = useSWR(
    workspaceSlug && !externalApiToken ? `IMPORTER_EXTERNAL_SERVICE_TOKEN` : null,
    workspaceSlug && !externalApiToken ? async () => fetchExternalApiToken(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  // validating the importer is authenticated or not
  const { isLoading: importerAuthIsLoading } = useSWR(
    workspaceSlug && externalApiToken && userId ? `IMPORTER_AUTHENTICATION_ASANA_${workspaceSlug}_${userId}` : null,
    workspaceSlug && externalApiToken && userId ? async () => authVerification() : null,
    { errorRetryCount: 0 }
  );

  useEffect(() => {
    if (workspaceId && userId && externalApiToken && workspaceId != serviceWorkspaceId) {
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

  if ((!externalApiToken && externalApiTokenIsLoading) || (!currentAuth && importerAuthIsLoading))
    return <DashboardLoaderRoot />;

  if (!externalApiToken)
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
        <Fragment>{dashboardView ? <AsanaDashboardRoot /> : <StepsRoot />}</Fragment>
      )}
    </Fragment>
  );
}

export default observer(AsanaImporter);
