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
import { useFormContext } from "react-hook-form";
import { Button } from "@plane/propel/button";
import { HeaderField } from "../forms/header-field";
import type { TConnectorFormData } from "@plane/types";
import { useConnectors } from "@/plane-web/hooks/store/marketplace/use-connectors";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";

type ConfigureConnectorFormProps = {
  workspaceSlug: string;
  connectorId: string;
  handleClose: () => void;
};

export const ConfigureConnectorForm = observer(function ConfigureConnectorForm(props: ConfigureConnectorFormProps) {
  const { workspaceSlug, connectorId, handleClose } = props;
  const { updateConnectorCredentials } = useConnectors();
  const methods = useFormContext<TConnectorFormData>();
  const { handleSubmit } = methods;
  const handleFormSubmit = async (data: TConnectorFormData) => {
    try {
      await updateConnectorCredentials(workspaceSlug, connectorId, data.headers ?? []);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Connector configured successfully",
        message: "Connector configured successfully",
      });
      handleClose();
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error configuring connector",
        message: "Error configuring connector",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit((data) => handleFormSubmit(data))} className="flex flex-col gap-4">
      {/* Headers type */}
      <label htmlFor="url" className="text-body-xs-medium text-primary">
        Headers
      </label>
      <HeaderField />
      <div className="flex justify-end gap-2 border-t border-subtle pt-4">
        <Button variant="ghost" size="lg" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" size="lg" type="submit">
          Configure
        </Button>
      </div>
    </form>
  );
});
