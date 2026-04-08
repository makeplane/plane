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
// components
import { cn } from "@plane/utils";
import { DeleteConnectorModal } from "./modals/delete-modal";
import { CustomMenu } from "@plane/ui";
import { Edit, MoreHorizontal, Settings, TrashIcon, Unplug } from "lucide-react";
import type { TConnector } from "@plane/types";
import { CreateConnectorModal } from "./modals/create-modal";
import { IconButton } from "@plane/propel/icon-button";
import { ConfigureConnectorModal } from "./modals/configure-modal";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useConnectors } from "@/plane-web/hooks/store/marketplace/use-connectors";

type TCustomMenuOptions = {
  key: string;
  type: string;
  label: string;
  shouldRender: boolean;
  prependIcon: React.ReactNode;
  onClick: () => void;
};
type ConnectorTileQuickActionsProps = {
  workspaceSlug: string;
  connector: TConnector;
};

export const ConnectorTileQuickActions = observer(function ConnectorTileQuickActions(
  props: ConnectorTileQuickActionsProps
) {
  const { workspaceSlug, connector } = props;
  // state
  const [isDeleteConnectorModalOpen, setIsDeleteConnectorModalOpen] = useState(false);
  const [isEditConnectorModalOpen, setIsEditConnectorModalOpen] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  // store hooks
  const { disconnectConnector } = useConnectors();
  const handleDisconnect = async () => {
    try {
      await disconnectConnector(workspaceSlug, connector.id);
    } catch (error) {
      console.error("Failed to disconnect connector", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to disconnect connector",
      });
    }
  };

  const popoverMenuOptions: TCustomMenuOptions[] = [
    {
      key: "menu-edit",
      type: "menu-item",
      label: "Edit",
      shouldRender: true,
      prependIcon: <Edit className="shrink-0 h-3 w-3" />,
      onClick: () => {
        setIsEditConnectorModalOpen(true);
      },
    },
    {
      key: "menu-configure",
      type: "menu-item",
      label: "Configure",
      shouldRender: connector.authorization_type === "header" && connector.is_configured,
      prependIcon: <Settings className="shrink-0 h-3 w-3" />,
      onClick: () => {
        setIsConfigureModalOpen(true);
      },
    },
    {
      key: "menu-disconnect",
      type: "menu-item",
      label: "Disconnect",
      shouldRender: connector.is_connected,
      prependIcon: <Unplug className="shrink-0 h-3 w-3" />,
      onClick: () => {
        handleDisconnect();
      },
    },
    {
      key: "menu-delete",
      type: "menu-item",
      label: "Delete",
      shouldRender: connector.is_custom,
      prependIcon: <TrashIcon className="shrink-0 h-3 w-3" />,
      onClick: () => {
        setIsDeleteConnectorModalOpen(true);
      },
    },
  ];
  return (
    <>
      <CustomMenu customButton={<IconButton icon={MoreHorizontal} variant="ghost" size="sm" />} closeOnSelect>
        {popoverMenuOptions.map((item) => {
          if (!item.shouldRender) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={() => item.onClick && item.onClick()}
              className={cn("flex items-center gap-2")}
            >
              {item.prependIcon && item.prependIcon}
              <div>
                <h5>{item.label}</h5>
              </div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
      <DeleteConnectorModal
        workspaceSlug={workspaceSlug}
        connectorId={connector.id}
        isOpen={isDeleteConnectorModalOpen}
        handleClose={() => setIsDeleteConnectorModalOpen(false)}
      />
      <CreateConnectorModal
        title="Edit Connector"
        preloadData={connector}
        isMetadataEditable={connector.is_custom}
        workspaceSlug={workspaceSlug}
        isOpen={isEditConnectorModalOpen}
        onClose={() => setIsEditConnectorModalOpen(false)}
      />
      <ConfigureConnectorModal
        workspaceSlug={workspaceSlug}
        isOpen={isConfigureModalOpen}
        connectorId={connector.id}
        preloadData={connector}
        onClose={() => setIsConfigureModalOpen(false)}
      />
    </>
  );
});
