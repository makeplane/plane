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
import { E_FEATURE_FLAGS } from "@plane/constants";
import NotionLogo from "@/app/assets/services/notion.svg?url";
import { DashboardLoaderRoot } from "@/components/importers/common/dashboard";
import { ZipImporterDashboard } from "@/components/importers/zip-importer";
import { StepsRoot } from "@/components/importers/zip-importer/steps/root";
import { useFlag } from "@/plane-web/hooks/store";
import { useZipImporter } from "@/plane-web/hooks/store/importers/use-zip-importer";
import type { TZipImporterProps } from "@/types/importers/zip-importer";
import { EZipDriverType } from "@/types/importers/zip-importer";

function NotionImporter() {
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
  } = useZipImporter(EZipDriverType.NOTION);

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
      <div className="text-secondary relative flex justify-center items-center">
        <div className="flex flex-col items-center justify-center">
          <div className="text-secondary text-20 font-medium">Notion Importer is not enabled</div>
        </div>
      </div>
    );

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

  const props: TZipImporterProps = {
    driverType: EZipDriverType.NOTION,
    logo: NotionLogo,
    serviceName: "Notion",
  };

  return <Fragment>{dashboardView ? <ZipImporterDashboard {...props} /> : <StepsRoot {...props} />}</Fragment>;
}

export default observer(NotionImporter);
