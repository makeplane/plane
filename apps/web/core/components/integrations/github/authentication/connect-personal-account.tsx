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
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store/integrations";

interface IConnectPersonalAccountProps {
  isEnterprise: boolean;
}

export const ConnectPersonalAccount = observer(function ConnectPersonalAccount({
  isEnterprise,
}: IConnectPersonalAccountProps) {
  // hooks
  const {
    workspace,
    auth: {
      githubUserCredentialIds,
      githubUserCredentialById,
      fetchGithubUserCredential,
      connectGithubUserCredential,
      disconnectGithubUserCredential,
    },
  } = useGithubIntegration(isEnterprise);

  // states
  const [isConnectionSetup, setIsConnectionSetup] = useState<boolean>(false);

  // derived values
  const workspaceId = workspace?.id || undefined;
  const githubUserCredentialId = githubUserCredentialIds[0] || undefined;
  const githubUserCredential = githubUserCredentialId ? githubUserCredentialById(githubUserCredentialId) : undefined;
  const { t } = useTranslation();

  // handlers
  const handleConnectUser = async () => {
    try {
      setIsConnectionSetup(true);
      const response = await connectGithubUserCredential();
      if (response) window.open(response, "_self");
    } catch (error) {
      console.error("connectGithubUserCredential", error);
    } finally {
      setIsConnectionSetup(false);
    }
  };

  const handleDisconnectUser = async () => {
    try {
      setIsConnectionSetup(true);
      await disconnectGithubUserCredential();
    } catch (error) {
      console.error("disconnectGithubUserCredential", error);
    } finally {
      setIsConnectionSetup(false);
    }
  };

  const handleGithubUserAuth = () => {
    if (!githubUserCredential?.isConnected) handleConnectUser();
    else handleDisconnectUser();
  };

  // fetching github organization connection
  const { isLoading, error } = useSWR(
    workspaceId ? `GITHUB_USER_INTEGRATION_${workspaceId}` : null,
    workspaceId ? async () => await fetchGithubUserCredential() : null,
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
      {githubUserCredential?.isConnected ? (
        <div className="space-y-1">
          <div className="text-body-sm-medium">{t("github_integration.personal_account_connected")}</div>
          <div className="text-body-xs-regular text-secondary">
            {t("github_integration.personal_account_connected_description")}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-body-sm-medium">{t("github_integration.connect_personal_account")}</div>
          <div className="text-body-xs-regular text-secondary">
            {t("github_integration.connect_personal_account_description")}
          </div>
        </div>
      )}
      <Button
        variant="secondary"
        className="flex-shrink-0"
        onClick={handleGithubUserAuth}
        disabled={(isLoading && githubUserCredential) || isConnectionSetup || error}
      >
        {(isLoading && githubUserCredential) || error
          ? "..."
          : isConnectionSetup
            ? t("common.processing")
            : !githubUserCredential?.isConnected
              ? t("common.connect")
              : t("common.disconnect")}
      </Button>
    </div>
  );
});
