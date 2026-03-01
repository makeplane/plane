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
import { E_FEATURE_FLAGS } from "@plane/constants";
import { AuthenticationRoot, StepsRoot } from "@/components/importers/clickup";
//  plane web hooks
import { ClickUpDashboardRoot } from "@/components/importers/clickup/dashboard/root";
import { DashboardLoaderRoot } from "@/components/importers/common/dashboard";
import { useClickUpImporter, useFlag } from "@/plane-web/hooks/store";

function ClickUpImporter() {
  const {
    user,
    workspace,
    dashboardView,
    resetImporterData,
    auth: { currentAuth, authVerification },
    job: { workspaceId: serviceWorkspaceId, setDefaultServiceConfig },
  } = useClickUpImporter();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;

  // validating the importer is authenticated or not
  const { isLoading: importerAuthIsLoading } = useSWR(
    workspaceSlug && userId && !currentAuth ? `IMPORTER_AUTHENTICATION_CLICKUP_${workspaceSlug}_${user?.id}` : null,
    workspaceSlug && userId && !currentAuth ? async () => authVerification() : null,
    { errorRetryCount: 0 }
  );

  // initiating job service config
  useEffect(() => {
    if (workspaceId && workspaceSlug && userId && workspaceId != serviceWorkspaceId) {
      setDefaultServiceConfig(workspaceId, undefined);
    }
    return () => {
      resetImporterData();
    };
  }, [workspaceId, userId, serviceWorkspaceId, setDefaultServiceConfig, resetImporterData, workspaceSlug]);

  if (importerAuthIsLoading) return <DashboardLoaderRoot />;

  if (!currentAuth)
    return (
      <div className="text-secondary relative flex justify-center items-center">
        Not able to detect login. Please try again later.
      </div>
    );

  return (
    <Fragment>
      {!currentAuth?.isAuthenticated ? (
        <AuthenticationRoot />
      ) : (
        <Fragment>{dashboardView ? <ClickUpDashboardRoot /> : <StepsRoot />}</Fragment>
      )}
    </Fragment>
  );
}

export default observer(ClickUpImporter);
