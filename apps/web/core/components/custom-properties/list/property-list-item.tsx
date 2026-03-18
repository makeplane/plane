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
import { Switch } from "@plane/propel/switch";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { BaseCustomPropertyInstanceSchema } from "@plane/types";
import { CustomPropertyType } from "@plane/types";
import { cn, getCustomPropertyTypeDetails } from "@plane/utils";
// local imports
import { PropertyTypeIcon } from "../common/property-icon";
import { CustomPropertyQuickActions } from "./quick-actions";

export type CustomPropertyItemActions = {
  edit: () => void;
  delete: () => Promise<void>;
};

type CustomPropertyListItemProps = {
  property: BaseCustomPropertyInstanceSchema<CustomPropertyType>;
  actions: CustomPropertyItemActions;
};

export const CustomPropertyListItem = observer(function CustomPropertyListItem(props: CustomPropertyListItemProps) {
  const { property, actions } = props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const propertyTypeDetails = property.property_type
    ? getCustomPropertyTypeDetails(property.property_type, property.relation_type)
    : undefined;

  // handlers
  const handleEnableDisable = async (isActive: boolean) => {
    property
      .updateProperty({
        is_active: isActive,
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_types.settings.properties.toast.enable_disable.error.title"),
          message: t("work_item_types.settings.properties.toast.enable_disable.error.message"),
        });
      });
  };

  const handleDelete = async () => {
    await actions
      .delete()
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("work_item_types.settings.properties.toast.delete.success.title"),
          message: t("work_item_types.settings.properties.toast.delete.success.message", {
            name: property.display_name,
          }),
        });
        return true;
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_types.settings.properties.toast.delete.error.title"),
          message: t("work_item_types.settings.properties.toast.delete.error.message"),
        });
      });
  };

  return (
    <div
      className={cn(
        "w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 group p-3 rounded-lg bg-layer-2 border border-subtle cursor-default overflow-hidden"
      )}
    >
      <div className="flex items-center gap-1">
        <div className="flex flex-col gap-1 w-full max-w-48 sm:max-w-[30vw]">
          <span className={cn("truncate text-body-sm-medium", property.is_active ? "text-primary" : "text-secondary")}>
            {property.display_name}
          </span>
          {property.description && <span className="text-body-xs-regular text-tertiary">{property.description}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-3 transition-all duration-200">
        <div className="flex items-center gap-2.5 select-none">
          {propertyTypeDetails?.i18n_displayName && (
            <span
              className={cn(
                "flex shrink-0 w-fit gap-1 px-1.5 py-1 items-center justify-center text-caption-sm-medium text-tertiary bg-layer-3 rounded-md"
              )}
            >
              <PropertyTypeIcon iconKey={propertyTypeDetails.iconKey} className="size-3.5" />
              <span className="text-secondary">{t(propertyTypeDetails.i18n_displayName)}</span>
            </span>
          )}
        </div>
        {property.canEnableDisable && <Switch value={!!property.is_active} onChange={handleEnableDisable} />}
        <CustomPropertyQuickActions
          isPropertyDisabled={!property.is_active}
          onDisable={async () => handleEnableDisable(false)}
          onDelete={handleDelete}
          onEdit={actions.edit}
          canEdit={property.canEdit}
          canDelete={property.canDelete}
        />
      </div>
    </div>
  );
});
