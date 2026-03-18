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
import { EModalWidth, ModalCore, Loader } from "@plane/ui";
import { useBitbucketDCIntegration } from "@/plane-web/hooks/store";
import { ConnectBitbucketForm } from "./connect-form";

export const ConnectOrganization = observer(function ConnectOrganization() {
  const {
    workspace,
    auth: { workspaceConnectionIds, workspaceConnectionById, fetchWorkspaceConnection, disconnectWorkspaceConnection },
  } = useBitbucketDCIntegration();
  const { t } = useTranslation();

  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const workspaceId = workspace?.id;
  const connectionId = workspaceConnectionIds[0];
  const connection = connectionId ? workspaceConnectionById(connectionId) : undefined;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { isLoading, error } = useSWR(
    workspaceId ? `BITBUCKET_DC_INTEGRATION_${workspaceId}` : null,
    workspaceId ? () => fetchWorkspaceConnection() : null,
    { errorRetryCount: 0 }
  );

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await disconnectWorkspaceConnection();
    } catch (err) {
      console.error("disconnectWorkspaceConnection", err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (error) {
    return (
      <div className="text-secondary relative flex justify-center items-center">
        Failed to load Bitbucket connection status.
      </div>
    );
  }

  return (
    <div className="relative flex justify-between items-center gap-4 p-4 border border-subtle rounded-md">
      <ModalCore isOpen={isFormOpen} handleClose={() => setIsFormOpen(false)} width={EModalWidth.LG}>
        <ConnectBitbucketForm handleClose={() => setIsFormOpen(false)} />
      </ModalCore>

      {connection ? (
        <div className="w-full relative flex items-center gap-4">
          <div className="space-y-0.5 w-full">
            <div className="text-body-sm-medium">
              {connection.connection_data?.user?.displayName || connection.connection_data?.user?.slug || "Bitbucket"}
            </div>
            <div className="text-body-xs-regular text-secondary">{connection.connection_data?.baseUrl}</div>
          </div>
        </div>
      ) : (
        <div className="space-y-0.5 w-full">
          <div className="text-body-sm-medium">Connect Bitbucket Data Center</div>
          <div className="text-body-xs-regular text-secondary">Connect using an OAuth 2.0 application link.</div>
        </div>
      )}

      {isLoading && !connectionId ? (
        <Loader>
          <Loader.Item height="29px" width="82px" />
        </Loader>
      ) : (
        <Button
          variant={connectionId ? "secondary" : "primary"}
          className="flex-shrink-0"
          onClick={connectionId ? handleDisconnect : () => setIsFormOpen(true)}
          disabled={isDisconnecting || (isLoading && !!connectionId) || !!error}
        >
          {isDisconnecting ? t("common.processing") : connectionId ? t("common.disconnect") : t("common.connect")}
        </Button>
      )}
    </div>
  );
});
