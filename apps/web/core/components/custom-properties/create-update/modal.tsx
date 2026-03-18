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
// plane imports
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon } from "@plane/propel/icons";
import type { CustomPropertyType, CustomProperty, TIssuePropertyOptionCreateUpdateData } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// local imports
import { CustomPropertyOptionsProvider } from "./context";
import { CustomPropertyForm } from "./form";
import type {
  TCustomPropertyValidator,
  CustomPropertyCreateUpdateActions,
  CustomPropertyCreateUpdatePermissions,
} from "./types";

type CustomPropertyCreateUpdateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyData?: Partial<CustomProperty<CustomPropertyType>>;
  propertyId?: string;
  actions: CustomPropertyCreateUpdateActions;
  permissions: CustomPropertyCreateUpdatePermissions;
  propertyValidator?: TCustomPropertyValidator;
  allProperties?: CustomProperty<CustomPropertyType>[];
};

export const CustomPropertyCreateUpdateModal = observer(function CustomPropertyCreateUpdateModal(
  props: CustomPropertyCreateUpdateModalProps
) {
  const { isOpen, onClose, propertyData, propertyId, actions, permissions, propertyValidator, allProperties } = props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const mode = propertyId ? "update" : "create";
  const initialData: Partial<CustomProperty<CustomPropertyType>> = propertyData ?? {};

  const getSortedActivePropertyOptionsAdapter = (id: string): TIssuePropertyOptionCreateUpdateData[] | undefined => {
    const options = actions.getSortedActivePropertyOptions(id);
    if (!options) return undefined;
    return options as unknown as TIssuePropertyOptionCreateUpdateData[];
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h4 className="text-h5-medium">
          {mode === "create"
            ? t("work_item_types.settings.properties.create_update.title.create")
            : t("work_item_types.settings.properties.create_update.title.update")}
        </h4>
        <IconButton icon={CloseIcon} variant="ghost" onClick={onClose} />
      </div>
      {/* Body */}
      <CustomPropertyOptionsProvider
        customPropertyId={propertyId}
        getSortedActivePropertyOptions={getSortedActivePropertyOptionsAdapter}
      >
        <CustomPropertyForm
          mode={mode}
          initialData={initialData}
          propertyId={propertyId}
          actions={actions}
          permissions={permissions}
          propertyValidator={propertyValidator}
          allProperties={allProperties}
          onClose={onClose}
        />
      </CustomPropertyOptionsProvider>
    </ModalCore>
  );
});
