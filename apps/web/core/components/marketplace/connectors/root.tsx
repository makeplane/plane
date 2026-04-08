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
import { Button } from "@plane/propel/button";
import { ConnectorList } from "./list";
import { CreateConnectorModal } from "./modals/create-modal";
import { useState } from "react";

type ConnectorListRootProps = {
  workspaceSlug: string;
};

export const ConnectorListRoot = observer(function ConnectorListRoot(props: ConnectorListRootProps) {
  const { workspaceSlug } = props;
  // state
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <div className="text-h6-medium">Connectors</div>
          <div className="text-body-xs-regular text-tertiary">
            These servers provide context to Plane AI without requiring complex authentication handshakes.{" "}
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" size="lg">
          Add connector
        </Button>
      </div>
      <div className="overflow-y-auto">
        <ConnectorList workspaceSlug={workspaceSlug} isInSettings />
      </div>
      <CreateConnectorModal workspaceSlug={workspaceSlug} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
});
