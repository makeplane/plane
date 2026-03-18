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
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Loader } from "@plane/ui";
import { useBitbucketDCIntegration } from "@/plane-web/hooks/store";

export const ConnectPersonalAccount = observer(function ConnectPersonalAccount() {
  const {
    workspace,
    auth: {
      userCredentialIds,
      userCredentialById,
      fetchUserCredential,
      disconnectUserCredential,
      connectUserCredentialOAuth,
    },
  } = useBitbucketDCIntegration();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const workspaceId = workspace?.id;
  const userCredentialId = userCredentialIds[0];
  const userCredential = userCredentialId ? userCredentialById(userCredentialId) : undefined;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { isLoading, error } = useSWR(
    workspaceId ? `BITBUCKET_DC_USER_CREDENTIAL_${workspaceId}` : null,
    workspaceId ? () => fetchUserCredential() : null,
    { errorRetryCount: 0 }
  );

  const handleConnect = async () => {
    try {
      setIsSubmitting(true);
      const authUrl = await connectUserCredentialOAuth();
      if (authUrl) window.open(authUrl, "_self");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Failed to initiate OAuth connection. Try again.";
      setToast({ title: "Connection failed", message, type: TOAST_TYPE.ERROR });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await disconnectUserCredential();
    } catch (err) {
      console.error("disconnectUserCredential", err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (error) {
    return (
      <div className="text-secondary relative flex justify-center items-center">
        Failed to load personal account connection status.
      </div>
    );
  }

  return (
    <div className="relative flex justify-between items-center gap-4 p-4 border border-subtle rounded-md">
      {userCredential?.isConnected ? (
        <div className="space-y-1">
          <div className="text-body-sm-medium">Your Bitbucket Account Connected</div>
          <div className="text-body-xs-regular text-secondary">
            Actions in Bitbucket are attributed to your personal account.
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-body-sm-medium">Connect Your Bitbucket Account</div>
          <div className="text-body-xs-regular text-secondary">
            Link your personal Bitbucket account so actions are attributed to you.
          </div>
        </div>
      )}

      {isLoading && !userCredentialId ? (
        <Loader>
          <Loader.Item height="29px" width="82px" />
        </Loader>
      ) : (
        <Button
          variant="secondary"
          className="flex-shrink-0"
          onClick={userCredential?.isConnected ? handleDisconnect : () => void handleConnect()}
          disabled={isSubmitting || isDisconnecting || (isLoading && !!userCredentialId) || !!error}
        >
          {isSubmitting || isDisconnecting
            ? t("common.processing")
            : userCredential?.isConnected
              ? t("common.disconnect")
              : t("common.connect")}
        </Button>
      )}
    </div>
  );
});
