"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { GITHUB_INTEGRATION_TRACKER_ELEMENTS, GITHUB_INTEGRATION_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// plane web hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useGithubIntegration } from "@/plane-web/hooks/store/integrations";

interface IConnectPersonalAccountProps {
  isEnterprise: boolean;
}

export const ConnectPersonalAccount: FC<IConnectPersonalAccountProps> = observer(({ isEnterprise }) => {
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
      captureSuccess({
        eventName: GITHUB_INTEGRATION_TRACKER_EVENTS.connect_user,
        payload: {
          workspaceId,
        },
      });

      if (response) window.open(response, "_self");
    } catch (error) {
      console.error("connectGithubUserCredential", error);
      captureError({
        eventName: GITHUB_INTEGRATION_TRACKER_EVENTS.connect_user,
        payload: {
          workspaceId,
        },
      });
    } finally {
      setIsConnectionSetup(false);
    }
  };

  const handleDisconnectUser = async () => {
    try {
      setIsConnectionSetup(true);
      await disconnectGithubUserCredential();
      captureSuccess({
        eventName: GITHUB_INTEGRATION_TRACKER_EVENTS.disconnect_user,
        payload: {
          workspaceId,
        },
      });
    } catch (error) {
      console.error("disconnectGithubUserCredential", error);
      captureError({
        eventName: GITHUB_INTEGRATION_TRACKER_EVENTS.disconnect_user,
        payload: {
          workspaceId,
        },
      });
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
      <div className="text-custom-text-200 relative flex justify-center items-center">
        {t("github_integration.connection_fetch_error")}
      </div>
    );

  return (
    <div className="relative flex justify-between items-center gap-4 p-4 border border-custom-border-100 rounded">
      {githubUserCredential?.isConnected ? (
        <div className="space-y-1">
          <div className="text-base font-medium">{t("github_integration.personal_account_connected")}</div>
          <div className="text-sm text-custom-text-200">
            {t("github_integration.personal_account_connected_description")}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-base font-medium">{t("github_integration.connect_personal_account")}</div>
          <div className="text-sm text-custom-text-200">
            {t("github_integration.connect_personal_account_description")}
          </div>
        </div>
      )}
      <Button
        variant="neutral-primary"
        size="sm"
        className="flex-shrink-0"
        onClick={handleGithubUserAuth}
        disabled={(isLoading && githubUserCredential) || isConnectionSetup || error}
        data-ph-element={GITHUB_INTEGRATION_TRACKER_ELEMENTS.CONNECT_DISCONNECT_PERSONAL_ACCOUNT_BUTTON}
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
