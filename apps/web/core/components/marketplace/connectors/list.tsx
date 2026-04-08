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

import { ConnectorTile } from "./tile";
import { useConnectors } from "@/plane-web/hooks/store/marketplace/use-connectors";
import { observer } from "mobx-react";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Loader } from "@plane/ui";
import type { TConnector } from "@plane/types";

type ConnectorListProps = {
  workspaceSlug: string;
  isInSettings?: boolean;
  onConnectActions?: (connector: TConnector) => React.ReactNode;
  query?: string;
};

export const ConnectorList = observer(function ConnectorList(props: ConnectorListProps) {
  const { workspaceSlug, onConnectActions, isInSettings = false, query } = props;
  // hooks
  const { getConnectorsByWorkspaceSlug, connectorsLoader } = useConnectors();
  // derived values
  const connectors = getConnectorsByWorkspaceSlug(workspaceSlug);
  const filteredConnectors = query
    ? connectors.filter((connector) => connector?.name?.toLowerCase().includes(query?.toLowerCase() ?? ""))
    : connectors;
  if (connectorsLoader === "init-loader") {
    return (
      <Loader className="w-full flex flex-col gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Loader.Item key={index} height="68px" />
        ))}
      </Loader>
    );
  }
  if (filteredConnectors.length === 0) {
    return (
      <EmptyStateCompact
        assetKey="runner-scripts"
        title="No connectors found"
        description={query ? "No connectors found matching your search" : "Create your first connector to get started"}
        align="start"
        rootClassName="py-20"
      />
    );
  }
  return (
    <div className="flex flex-col gap-4 overflow-y-scroll">
      {filteredConnectors.map((connector) => (
        <ConnectorTile
          key={connector.id}
          connector={connector}
          onConnectActions={onConnectActions}
          isInSettings={isInSettings}
        />
      ))}
    </div>
  );
});
