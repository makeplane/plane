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
import { AvatarGroup } from "@plane/propel/avatar";
import { Menu } from "@plane/propel/menu";
import { ManageConnectorModal } from "./modals/manage-modal";
import { useState } from "react";
import { ConnectorsQuickAccess } from "./connectors-quick-access";
import { ConnectorLogo } from "./connector-logo";
import { useConnectors } from "@/plane-web/hooks/store/marketplace/use-connectors";
import { cn } from "@plane/utils";
import { Tooltip } from "@plane/propel/tooltip";

export const ConnectorsPill = observer(function ConnectorsPill(props: {
  workspaceSlug: string;
  toggledConnectors: string[];
  isDisabled: boolean;
  handleConnectorToggle: (connectorId: string) => void;
}) {
  const { workspaceSlug, toggledConnectors, handleConnectorToggle, isDisabled } = props;
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const { getConnectorById, connectorsLoader } = useConnectors();

  if (toggledConnectors?.length === 0 || connectorsLoader === "init-loader") {
    return null;
  }
  const toggledConnectorsDetails = toggledConnectors
    .map((connectorId) => getConnectorById(connectorId))
    .filter(Boolean);

  if (toggledConnectorsDetails.length === 0) {
    return null;
  }
  return (
    <>
      <ManageConnectorModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        toggledConnectors={toggledConnectors}
        handleConnectorToggle={handleConnectorToggle}
      />
      <Tooltip
        tooltipContent={
          isDisabled
            ? "Switch to Build mode and add context to enable connectors."
            : `${toggledConnectors.length} connectors enabled`
        }
      >
        <div className={cn("inline-flex w-fit", isDisabled && "cursor-not-allowed")}>
          <div className={cn(isDisabled && "pointer-events-none")}>
            <Menu
              maxHeight="md"
              disabled={isDisabled}
              customButton={
                <button
                  type="button"
                  className="overflow-hidden h-7 bg-layer-1 rounded-lg flex items-center gap-1 w-fit max-w-25 px-2"
                  disabled={isDisabled}
                >
                  {toggledConnectorsDetails.length > 1 ? (
                    <>
                      <AvatarGroup size="sm">
                        {toggledConnectorsDetails.map((connector) => {
                          if (!connector) return null;
                          return (
                            <ConnectorLogo
                              key={connector.id}
                              connector={connector}
                              size="sm"
                              className={cn("rounded-full overflow-hidden", {
                                "opacity-40": isDisabled,
                              })}
                            />
                          );
                        })}
                      </AvatarGroup>
                      <span
                        className={cn("text-body-xs-medium text-placeholder", {
                          "text-disabled": isDisabled,
                        })}
                      >
                        {toggledConnectorsDetails.length}
                      </span>
                    </>
                  ) : (
                    toggledConnectorsDetails[0] && (
                      <>
                        <ConnectorLogo
                          connector={toggledConnectorsDetails[0]}
                          size="sm"
                          className={cn("rounded-full overflow-hidden", {
                            "opacity-40": isDisabled,
                          })}
                        />
                        <span
                          className={cn("truncate text-body-xs-medium text-primary", {
                            "text-disabled": isDisabled,
                          })}
                        >
                          {toggledConnectorsDetails[0].name}
                        </span>
                      </>
                    )
                  )}
                </button>
              }
              customButtonClassName="flex flex-grow justify-center text-13 text-secondary outline-none"
              optionsClassName="p-1 text-primary"
              noChevron
            >
              <ConnectorsQuickAccess
                workspaceSlug={workspaceSlug}
                toggledConnectors={toggledConnectors}
                handleConnectorToggle={handleConnectorToggle}
                onOpenManageConnectorModal={() => setIsManageModalOpen(true)}
              />
            </Menu>
          </div>
        </div>
      </Tooltip>
    </>
  );
});
