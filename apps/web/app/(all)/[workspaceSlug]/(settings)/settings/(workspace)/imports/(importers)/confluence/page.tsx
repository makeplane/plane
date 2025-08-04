"use client";

import { FC, Fragment, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { DashboardLoaderRoot } from "@/plane-web/components/importers/common/dashboard";
import { ZipImporterDashboard } from "@/plane-web/components/importers/zip-importer/dashboard";
import { StepsRoot } from "@/plane-web/components/importers/zip-importer/steps/root";
import { useFlag } from "@/plane-web/hooks/store";
import { useZipImporter } from "@/plane-web/hooks/store/importers/use-zip-importer";
import { EZipDriverType, TZipImporterProps } from "@/plane-web/types/importers/zip-importer";
import ConfluenceLogo from "@/public/services/confluence.svg";

const ConfluenceImporter: FC = observer(() => {
  const {
    // Properties
    workspace,
    user,
    externalApiToken,
    dashboardView,

    // Actions
    fetchExternalApiToken,
    verifyAndAddCredentials,
    resetImporterData,
    job: { workspaceId: serviceWorkspaceId, setDefaultServiceConfig },
  } = useZipImporter(EZipDriverType.CONFLUENCE);

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;

  const isFeatureEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.CONFLUENCE_IMPORTER) || false;

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
          <div className="text-custom-text-200 text-2xl font-medium">Confluence Importer is not enabled</div>
        </div>
      </div>
    );

  if (externalApiTokenIsLoading || verifyCredentialsLoading) {
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

  const props: TZipImporterProps = {
    driverType: EZipDriverType.CONFLUENCE,
    logo: ConfluenceLogo,
    serviceName: "Confluence",
  };

  return <Fragment>{dashboardView ? <ZipImporterDashboard {...props} /> : <StepsRoot {...props} />}</Fragment>;
});

export default ConfluenceImporter;
