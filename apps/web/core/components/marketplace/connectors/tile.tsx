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

import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TConnector } from "@plane/types";
import { ConnectorTileQuickActions } from "./quick-actions";
import { useConnectors } from "@/plane-web/hooks/store/marketplace/use-connectors";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { ConfigureConnectorModal } from "./modals/configure-modal";
import { useState } from "react";
import { ConnectorLogo } from "./connector-logo";
import { API_BASE_PATH, API_BASE_URL } from "@plane/constants";

type ConnectorTileProps = {
  connector: TConnector;
  isInSettings?: boolean;
  onConnectActions?: (connector: TConnector) => React.ReactNode;
};

export const ConnectorTile = observer(function ConnectorTile(props: ConnectorTileProps) {
  const { connector, onConnectActions, isInSettings } = props;
  // hooks
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const router = useRouter();
  const { connectConnector } = useConnectors();
  // state
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // handlers
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      await connectConnector(workspaceSlug, connector.id, connector);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Connector connected successfully",
      });
    } catch (error) {
      console.error("Failed to connect connector", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to connect connector",
      });
    } finally {
      setIsLoading(false);
    }
  };
  // derived values
  const renderOnConnect = onConnectActions ? (
    onConnectActions(connector)
  ) : (
    <div className="text-caption-md-medium text-success-secondary bg-success-subtle rounded-md px-2 h-6 items-center flex">
      Connected
    </div>
  );

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg bg-layer-2 border border-subtle p-3">
        <ConnectorLogo connector={connector} size="lg" />
        <div className="flex flex-col space-y-1 flex-1 w-full">
          <div className="flex gap-2 items-center">
            <div className="text-body-sm-medium">{connector.name}</div>
            {connector.is_custom && (
              <div className="text-caption-sm-medium text-accent-primary rounded-md bg-accent-subtle-hover p-1">
                Custom
              </div>
            )}
          </div>
          <div className="text-body-xs-regular text-secondary flex-1 line-clamp-2">
            {connector.description_stripped}
          </div>
        </div>
        <div className="flex items-center gap-x-1 flex-wrap">
          {connector.is_connected ? (
            renderOnConnect
          ) : connector.is_configured ? (
            <Button
              variant="secondary"
              onClick={() => {
                if (connector.authorization_type === "oauth") {
                  window.location.href = `${API_BASE_URL}/api/silo/workspaces/${workspaceSlug}/mcp-applications/${connector.id}/connect/oauth/`;
                } else {
                  handleConnect();
                }
              }}
              loading={isLoading}
            >
              {t("workspace_settings.settings.applications.connect")}
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() =>
                isInSettings
                  ? setIsConfigureModalOpen(true)
                  : router.push(`/${workspaceSlug}/settings/integrations?tab=connectors`)
              }
            >
              {t("workspace_settings.settings.applications.configure")}
            </Button>
          )}
          {isInSettings && (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center self-center">
              <ConnectorTileQuickActions workspaceSlug={workspaceSlug} connector={connector} />
            </div>
          )}
        </div>
      </div>
      <ConfigureConnectorModal
        workspaceSlug={workspaceSlug}
        isOpen={isConfigureModalOpen}
        connectorId={connector.id}
        onClose={() => setIsConfigureModalOpen(false)}
      />
    </>
  );
});
