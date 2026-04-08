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
import { Cable, Plus } from "lucide-react";
import { Menu } from "@plane/propel/menu";
import { AttachmentActionButton } from "./attachment-button";
import { ConnectorsQuickAccess } from "../../marketplace/connectors/connectors-quick-access";
import { ManageConnectorModal } from "@/components/marketplace/connectors/modals/manage-modal";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import { WithAiFeatureFlagHOC } from "@/components/feature-flags/with-ai-feature-flag-hoc";

type TProps = {
  workspaceSlug: string;
  isUploading: boolean;
  toggledConnectors: string[];
  mode: string;
  isConnectorsDisabled: boolean;
  handleConnectorToggle: (connectorId: string) => void;
  open: () => void;
};
export function QuickActions(props: TProps) {
  const { workspaceSlug, open, isUploading, toggledConnectors, handleConnectorToggle, mode, isConnectorsDisabled } =
    props;
  const [isManageConnectorModalOpen, setIsManageConnectorModalOpen] = useState(false);
  return (
    <>
      <ManageConnectorModal
        isOpen={isManageConnectorModalOpen}
        onClose={() => setIsManageConnectorModalOpen(false)}
        toggledConnectors={toggledConnectors}
        handleConnectorToggle={handleConnectorToggle}
      />
      <Menu
        maxHeight="md"
        customButton={
          <div
            data-tour="mcp-connectors-tour-step-0"
            className="flex gap-2 rounded-md border border-subtle size-7 justify-center items-center"
          >
            <Plus className="size-4 text-icon-tertiary" />
          </div>
        }
        customButtonClassName="flex flex-grow justify-center text-13 text-secondary outline-none"
        optionsClassName="p-1 text-primary"
        noChevron
      >
        <Menu.MenuItem className="flex items-center gap-2 p-2" onClick={() => open()}>
          <AttachmentActionButton open={open} isLoading={isUploading} />
        </Menu.MenuItem>
        <WithAiFeatureFlagHOC flag="AI_MCP_CONNECTORS" disabledFallback={<></>} workspaceSlug={workspaceSlug}>
          <Tooltip
            tooltipContent={
              isConnectorsDisabled ? "Switch to Build mode and add context to enable connectors." : undefined
            }
            disabled={!isConnectorsDisabled}
          >
            <div className={cn("inline-flex w-fit", isConnectorsDisabled && "cursor-not-allowed")}>
              <div className={cn(isConnectorsDisabled && "pointer-events-none")}>
                <Menu.SubMenu
                  disabled={isConnectorsDisabled}
                  trigger={
                    <div className="flex items-center gap-2 rounded-xs">
                      <Cable className="size-4 text-icon-secondary" />
                      <span className="text-body-sm-regular text-primary">Add Connectors</span>
                    </div>
                  }
                  showChevron={!isConnectorsDisabled}
                  className="min-w-48 rounded-md border-[0.5px] border-strong bg-surface-1 p-1 text-11"
                >
                  <ConnectorsQuickAccess
                    workspaceSlug={workspaceSlug}
                    toggledConnectors={toggledConnectors}
                    handleConnectorToggle={handleConnectorToggle}
                    onOpenManageConnectorModal={() => setIsManageConnectorModalOpen(true)}
                  />
                </Menu.SubMenu>
              </div>
            </div>
          </Tooltip>
        </WithAiFeatureFlagHOC>
      </Menu>
    </>
  );
}
