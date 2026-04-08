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
import { Menu } from "@plane/propel/menu";
import { Cable } from "lucide-react";
import { Switch } from "@plane/propel/switch";
import { Avatar } from "@plane/propel/avatar";
import { useConnectors } from "@/plane-web/hooks/store/marketplace/use-connectors";
import useSWR from "swr";
import { ConnectorLogo } from "./connector-logo";

type TProps = {
  workspaceSlug: string;
  toggledConnectors: string[];
  handleConnectorToggle: (connectorId: string) => void;
  onOpenManageConnectorModal: () => void;
};

export const ConnectorsQuickAccess = observer(function ConnectorsQuickAccess(props: TProps) {
  const { workspaceSlug, toggledConnectors, handleConnectorToggle, onOpenManageConnectorModal } = props;
  const { getMostUsedConnectors, fetchMostUsedConnectors } = useConnectors();
  const connectors = getMostUsedConnectors();

  useSWR(`MOST_USED_CONNECTORS_${workspaceSlug}`, () => fetchMostUsedConnectors(workspaceSlug), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    // Global SWRConfig uses revalidateOnMount: true; this subtree remounts whenever the submenu opens.
    revalidateOnMount: false,
    revalidateOnReconnect: false,
  });

  return (
    <>
      {connectors.map((connector) => (
        <Menu.MenuItem className="flex items-center gap-2 p-2 justify-between" key={connector.id} closeOnClick={false}>
          <div className="flex items-center gap-2">
            {connector.logo_url ? (
              <ConnectorLogo connector={connector} size="sm" />
            ) : (
              <Avatar name={connector.name} className="rounded-full" />
            )}
            <div className="text-body-sm-regular text-primary">{connector.name}</div>
          </div>
          <Switch
            value={toggledConnectors.includes(connector.id)}
            onChange={() => handleConnectorToggle(connector.id)}
          />
        </Menu.MenuItem>
      ))}
      <Menu.MenuItem
        className="flex items-center gap-2 p-2 border-t border-subtle"
        onClick={onOpenManageConnectorModal}
      >
        <Cable className="size-4 text-icon-secondary" />
        <div className="text-body-sm-regular text-primary">Manage connectors</div>
      </Menu.MenuItem>
    </>
  );
});
