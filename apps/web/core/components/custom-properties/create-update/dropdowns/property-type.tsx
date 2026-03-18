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
import { ISSUE_PROPERTY_TYPE_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type {
  CustomPropertyRelationType,
  CustomPropertyType,
  CustomProperty,
  CustomPropertyTypeKey,
  TOperationMode,
} from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { cn, getCustomPropertyTypeDetails, getCustomPropertyTypeKey } from "@plane/utils";
// local imports
import { PropertyTypeIcon } from "../../common/property-icon";

type TPropertyTypeDropdownProps = {
  propertyType: CustomPropertyType | undefined;
  propertyRelationType: CustomPropertyRelationType | null | undefined;
  currentOperationMode: TOperationMode | null;
  handlePropertyObjectChange: (value: Partial<CustomProperty<CustomPropertyType>>) => void;
  error?: string;
  isUpdateAllowed: boolean;
  allowedPropertyTypes?: CustomPropertyTypeKey[];
};

export const PropertyTypeDropdown = observer(function PropertyTypeDropdown(props: TPropertyTypeDropdownProps) {
  const {
    propertyType,
    propertyRelationType,
    currentOperationMode,
    handlePropertyObjectChange,
    error = "",
    isUpdateAllowed,
    allowedPropertyTypes,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const isEditingAllowed = currentOperationMode && (currentOperationMode === "create" || isUpdateAllowed);
  const propertyTypeDetails = getCustomPropertyTypeDetails(propertyType, propertyRelationType);

  // Can be used with CustomSearchSelect as well
  const issuePropertyTypeOptions = Object.entries(ISSUE_PROPERTY_TYPE_DETAILS)
    .filter(([key]) => !allowedPropertyTypes || allowedPropertyTypes.includes(key as CustomPropertyTypeKey))
    .map(([key, property]) => ({
      value: key,
      query: t(property.i18n_displayName),
      content: (
        <div className="flex gap-2 items-center">
          <div className="flex-shrink-0">
            <PropertyTypeIcon iconKey={property.iconKey} />
          </div>
          <div>{t(property.i18n_displayName)}</div>
        </div>
      ),
    }));

  const onPropertyTypeChange = (key: CustomPropertyTypeKey) => {
    handlePropertyObjectChange({
      ...ISSUE_PROPERTY_TYPE_DETAILS[key]?.dataToUpdate,
    });
  };

  return (
    <div>
      <span className="text-caption-md-medium text-tertiary">
        {t("work_item_types.settings.properties.dropdown.label")}
      </span>
      <CustomSearchSelect
        value={getCustomPropertyTypeKey(propertyType, propertyRelationType)}
        label={
          propertyTypeDetails ? (
            <span className="flex items-center gap-1.5">
              <PropertyTypeIcon iconKey={propertyTypeDetails.iconKey} className="size-3.5" />
              {t(propertyTypeDetails.i18n_displayName)}
            </span>
          ) : (
            t("work_item_types.settings.properties.dropdown.placeholder")
          )
        }
        options={issuePropertyTypeOptions}
        onChange={onPropertyTypeChange}
        optionsClassName="w-48"
        buttonClassName={cn(
          "rounded-sm text-body-xs-medium border-[0.5px] bg-surface-1 border-subtle-1",
          Boolean(error) && "border-danger-strong",
          {
            "bg-layer-1": !isEditingAllowed,
          }
        )}
        disabled={!isEditingAllowed}
      />
    </div>
  );
});
