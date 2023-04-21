import React, { useEffect } from "react";

import useSWR from "swr";

// services
import appinstallationsService from "services/app-installations.service";
import IntegrationService from "services/integration";
// components
import { Spinner } from "components/ui";

import { useRouter } from "next/router";

import { WORKSPACE_INTEGRATIONS } from "constants/fetch-keys";

interface IGithuPostInstallationProps {
  installation_id: string;
  setup_action: string;
  state: string;
  provider: string;
  code: string;
  projectId: string;
}

// TODO:Change getServerSideProps to router.query
const AppPostInstallation = ({
  installation_id,
  setup_action,
  state,
  provider,
  code,
  projectId,
}: IGithuPostInstallationProps) => {

  console.log(state, provider, code)
  const { data: workspaceIntegrations } = useSWR(
    state ? WORKSPACE_INTEGRATIONS(state as string) : null,
    () => (state ? IntegrationService.getWorkspaceIntegrationsList(state as string) : null)
  );
  console.log(workspaceIntegrations)

  const workspaceIntegrationId = workspaceIntegrations?.find(
    (integration) => integration.integration_detail.provider === provider
  );

  console.log(workspaceIntegrationId);

  useEffect(() => {
    if (provider && state && code) {
      appinstallationsService
        .getSlackAuthDetails(code)
        .then((res) => {
          const payload = {
            metadata: {
              ...res,
            },
          };
          workspaceIntegrationId && appinstallationsService
            .addSlackChannel(state, projectId, workspaceIntegrationId?.integration?.toString(), payload)
            .then((r) => {
              window.opener = null;
              window.open("", "_self");
              window.close();
            })
            .catch((err) => {
              throw err?.response;
            });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [state, installation_id, provider, code, projectId, workspaceIntegrationId]);

  return (
    <div className="absolute top-0 left-0 z-50 flex h-full w-full flex-col items-center justify-center gap-y-3 bg-white">
      <h2 className="text-2xl text-gray-900">Installing. Please wait...</h2>
      <Spinner />
    </div>
  );
};

export async function getServerSideProps(context: any) {
  return {
    props: context.query,
  };
}

export default AppPostInstallation;
