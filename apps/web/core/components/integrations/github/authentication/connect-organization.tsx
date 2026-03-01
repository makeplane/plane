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

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// Plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EModalWidth, ModalCore, Loader } from "@plane/ui";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store/integrations";
import { GithubEnterpriseServerAppForm } from "./server-app-form";
import { useParams } from "next/navigation";
import { useMember } from "@/hooks/store/use-member";

interface IConnectOrganizationProps {
  isEnterprise: boolean;
}

export const ConnectOrganization = observer(function ConnectOrganization({ isEnterprise }: IConnectOrganizationProps) {
  // hooks
  const {
    workspace,
    auth: {
      workspaceConnectionIds,
      workspaceConnectionById,
      fetchWorkspaceConnection,
      connectWorkspaceConnection,
      disconnectWorkspaceConnection,
    },
  } = useGithubIntegration(isEnterprise);
  const {
    workspace: { updateChecklistIfNotDoneAlready },
  } = useMember();

  const { workspaceSlug } = useParams();

  // states
  const [isConnectionSetup, setIsConnectionSetup] = useState<boolean>(false);
  const [isServerAppFormOpen, setIsServerAppFormOpen] = useState<boolean>(false);

  // derived values
  const workspaceId = workspace?.id || undefined;
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const workspaceConnection = workspaceConnectionId ? workspaceConnectionById(workspaceConnectionId) : undefined;
  const { t } = useTranslation();

  // after server app form is submitted, connect the organization
  const handleServerAppFormSubmitSuccess = async () => {
    await handleConnectOrganization();
    setIsServerAppFormOpen(false);
  };

  // handlers
  const handleConnectOrganization = async () => {
    try {
      setIsConnectionSetup(true);
      const response = await connectWorkspaceConnection();
      // Auto-complete getting started checklist
      if (workspaceSlug) {
        void updateChecklistIfNotDoneAlready(workspaceSlug.toString(), "integration_linked");
      }
      if (response) window.open(response, "_self");
    } catch (error) {
      console.error("connectWorkspaceConnection", error);
    } finally {
      setIsConnectionSetup(false);
    }
  };

  const handleDisconnectOrganization = async () => {
    try {
      setIsConnectionSetup(true);
      await disconnectWorkspaceConnection();
    } catch (error) {
      console.error("disconnectWorkspaceConnection", error);
    } finally {
      setIsConnectionSetup(false);
    }
  };

  const handleGithubAuth = () => {
    if (!workspaceConnectionId) {
      if (isEnterprise) setIsServerAppFormOpen(true);
      else handleConnectOrganization();
    } else handleDisconnectOrganization();
  };

  // fetching github workspace connection connection
  const { isLoading, error } = useSWR(
    workspaceId ? `GITHUB_INTEGRATION_${workspaceId}` : null,
    workspaceId ? async () => await fetchWorkspaceConnection() : null,
    { errorRetryCount: 0 }
  );

  if (error)
    return (
      <div className="text-secondary relative flex justify-center items-center">
        {t("github_integration.connection_fetch_error")}
      </div>
    );

  return (
    <div className="relative flex justify-between items-center gap-4 p-4 border border-subtle rounded-md">
      <ModalCore isOpen={isServerAppFormOpen} handleClose={() => setIsServerAppFormOpen(false)} width={EModalWidth.XXL}>
        <GithubEnterpriseServerAppForm
          handleFormSubmitSuccess={handleServerAppFormSubmitSuccess}
          handleClose={() => setIsServerAppFormOpen(false)}
        />
      </ModalCore>
      {workspaceConnection ? (
        <div className="w-full relative flex items-center gap-4">
          <div className="flex-shrink-0 w-11 h-11 rounded-sm overflow-hidden relative">
            <img
              src={workspaceConnection?.connection_data?.avatar_url}
              alt={workspaceConnection?.connection_data?.login}
              className="object-contain w-full h-full overflow-hidden"
            />
          </div>
          <div className="space-y-0.5 w-full">
            <div className="text-body-sm-medium">{workspaceConnection?.connection_data?.login}</div>
          </div>
        </div>
      ) : (
        <div className="space-y-0.5 w-full">
          <div className="text-body-sm-medium">{t("github_integration.connect_org")}</div>
          <div className="text-body-xs-regular text-secondary">{t("github_integration.connect_org_description")}</div>
        </div>
      )}

      {isLoading && !workspaceConnectionId ? (
        <Loader>
          <Loader.Item height="29px" width="82px" />
        </Loader>
      ) : (
        <Button
          variant={workspaceConnectionId ? "secondary" : "primary"}
          className="flex-shrink-0"
          onClick={handleGithubAuth}
          disabled={(isLoading && workspaceConnectionId) || isConnectionSetup || error}
        >
          {(isLoading && !workspaceConnectionId) || error
            ? "..."
            : isConnectionSetup
              ? t("common.processing")
              : !workspaceConnectionId
                ? t("common.connect")
                : t("common.disconnect")}
        </Button>
      )}
    </div>
  );
});
