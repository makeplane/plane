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
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// ui
import { AlertModalCore } from "@plane/ui";
// hooks
import { useConnectors } from "@/plane-web/hooks/store/marketplace/use-connectors";

interface IDeleteConnector {
  workspaceSlug: string;
  connectorId: string;
  isOpen: boolean;
  handleClose: () => void;
}

export const DeleteConnectorModal = observer(function DeleteConnectorModal(props: IDeleteConnector) {
  const { workspaceSlug, connectorId, isOpen, handleClose } = props;
  // states
  const [loader, setLoader] = useState(false);
  // store hooks
  const { deleteConnector } = useConnectors();
  // router
  const handleSubmit = async () => {
    try {
      setLoader(true);
      await deleteConnector(workspaceSlug, connectorId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Connector deleted successfully",
      });
      handleClose();
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to delete connector",
      });
    } finally {
      setLoader(false);
    }
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={loader}
      isOpen={isOpen}
      title="Delete Connector"
      primaryButtonText={{
        loading: "Deleting",
        default: "Delete",
      }}
      content={<>Are you sure you want to delete this connector? This will remove the connector from this workspace.</>}
    />
  );
});
