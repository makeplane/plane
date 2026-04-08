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
import { useEffect } from "react";
import { EModalWidth, EModalPosition, ModalCore } from "@plane/ui";
import { IconButton } from "@plane/propel/icon-button";
import { X } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import type { TConnectorFormData, TConnector } from "@plane/types";
import { CreateConnectorForm } from "../forms/create-form";
type CreateConnectorModalProps = {
  workspaceSlug: string;
  isOpen: boolean;
  isMetadataEditable?: boolean;
  title?: string;
  preloadData?: TConnector;
  onClose: () => void;
};

export const CreateConnectorModal = observer(function CreateConnectorModal(props: CreateConnectorModalProps) {
  const { workspaceSlug, isOpen, isMetadataEditable = true, title = "Add new connector", preloadData, onClose } = props;
  const methods = useForm<TConnectorFormData>({});

  useEffect(() => {
    if (isOpen) {
      methods.reset({
        name: preloadData?.name ?? "",
        description: preloadData?.description_stripped ?? "",
        url: preloadData?.url ?? "",
        authorization_type: preloadData?.authorization_type ?? "",
        logo_url: preloadData?.logo_url ?? "",
      });
    }
  }, [isOpen, preloadData, methods]);

  const handleClose = () => {
    onClose();
    methods.reset();
  };

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      position={EModalPosition.TOP}
      width={EModalWidth.XXL}
      className="p-4 flex flex-col gap-4"
    >
      <div className="flex justify-between items-center">
        <div className="text-h5-medium text-primary">{title}</div>
        <IconButton icon={X} onClick={handleClose} variant="ghost" size="sm" />
      </div>
      <FormProvider {...methods}>
        <CreateConnectorForm
          workspaceSlug={workspaceSlug}
          isMetadataEditable={isMetadataEditable}
          preloadData={preloadData}
          handleClose={handleClose}
        />
      </FormProvider>
    </ModalCore>
  );
});
