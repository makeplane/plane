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

import { Combobox } from "@headlessui/react";
import { InputSearch, ModalCore } from "@plane/ui";
import { ConnectorList } from "../list";
import { useState } from "react";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type { TConnector } from "@plane/types";
import { Switch } from "@plane/propel/switch";

type ManageConnectorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  toggledConnectors: string[];
  handleConnectorToggle: (connectorId: string) => void;
};

const connectorActions = (
  connector: TConnector,
  toggledConnectors: string[],
  handleConnectorToggle: (connectorId: string) => void
) => {
  return (
    <Switch value={toggledConnectors?.includes(connector.id)} onChange={() => handleConnectorToggle(connector.id)} />
  );
};
export function ManageConnectorModal(props: ManageConnectorModalProps) {
  const { isOpen, onClose, toggledConnectors, handleConnectorToggle } = props;
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { workspaceSlug } = useParams();
  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="text-h5-medium text-primary">Manage connectors</div>
        <IconButton icon={X} onClick={onClose} variant="ghost" size="sm" />
      </div>
      <div className="flex gap-3 items-center">
        <Combobox value={null} onChange={setQuery}>
          <InputSearch
            isOpen={true}
            query={query}
            updateQuery={setQuery}
            isMobile={false}
            inputContainerClassName="h-8 rounded-lg flex-1"
            inputClassName="text-body-sm-regular text-secondary placeholder:text-placeholder"
          />
        </Combobox>
        <Button
          variant="primary"
          size="lg"
          className="h-8"
          onClick={() => router.push(`/${workspaceSlug}/settings/integrations?tab=connectors`)}
        >
          Add connector
        </Button>
      </div>
      <div className="overflow-y-auto min-h-[308px]">
        <ConnectorList
          onConnectActions={(connector) => connectorActions(connector, toggledConnectors, handleConnectorToggle)}
          workspaceSlug={workspaceSlug?.toString()}
          query={query}
        />
      </div>
    </ModalCore>
  );
}
