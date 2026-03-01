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

import React, { useMemo } from "react";
// plane imports
import { ISSUE_PROPERTY_TYPE_DETAILS } from "@plane/constants";
import type {
  EIssuePropertyType,
  IIssueProperty,
  IUserLite,
  TCustomPropertyFilterKey,
  TFilterConfig,
} from "@plane/types";
import { Avatar } from "@plane/ui";
import type { TCustomPropertyFilterParams, TFilterIconType } from "@plane/utils";
import {
  getBooleanPropertyFilterConfig,
  getDatePropertyFilterConfig,
  getDropdownPropertyFilterConfig,
  getFileURL,
  getIssuePropertyTypeKey,
  getMemberPickerPropertyFilterConfig,
  getNumberPropertyFilterConfig,
  getTextPropertyFilterConfig,
} from "@plane/utils";
// ce imports
import type { TFiltersOperatorConfigs } from "@/ce/hooks/rich-filters/use-filters-operator-configs";
import { CUSTOM_PROPERTY_ICON_MAP } from "@/components/work-item-types/properties/property-icon";

interface TUseCustomPropertyFiltersConfigProps {
  customProperties: IIssueProperty<EIssuePropertyType>[];
  getAdditionalRightContent: (property: IIssueProperty<EIssuePropertyType>) => JSX.Element | undefined;
  getPropertyTooltipContent: (property: IIssueProperty<EIssuePropertyType>) => React.ReactNode | undefined;
  isFilterEnabled: (key: TCustomPropertyFilterKey) => boolean;
  members: IUserLite[];
  operatorConfigs: TFiltersOperatorConfigs;
}

interface TCustomPropertyFiltersConfig {
  configs: Array<TFilterConfig<TCustomPropertyFilterKey>>;
  configMap: Record<TCustomPropertyFilterKey, TFilterConfig<TCustomPropertyFilterKey>>;
}

export const useCustomPropertyFiltersConfig = ({
  customProperties,
  getAdditionalRightContent,
  getPropertyTooltipContent,
  isFilterEnabled,
  members,
  operatorConfigs,
}: TUseCustomPropertyFiltersConfigProps): TCustomPropertyFiltersConfig =>
  useMemo(() => {
    const configs: Array<TFilterConfig<TCustomPropertyFilterKey>> = [];
    const configMap: Record<TCustomPropertyFilterKey, TFilterConfig<TCustomPropertyFilterKey>> = {};

    customProperties.forEach((property) => {
      if (!property.id) return;

      // Custom property key
      const customPropertyKey = `customproperty_${property.id}` as const;
      const isEnabled = isFilterEnabled(customPropertyKey) && !!property.is_active;

      // Property type details
      const propertyTypeKey = getIssuePropertyTypeKey(property.property_type, property.relation_type);
      const propertyTypeDetails = ISSUE_PROPERTY_TYPE_DETAILS[propertyTypeKey];

      // Generate config based on property type
      let config: TFilterConfig<TCustomPropertyFilterKey> | null = null;

      const commonConfig: TCustomPropertyFilterParams<TFilterIconType> = {
        isEnabled,
        filterIcon: propertyTypeDetails?.iconKey ? CUSTOM_PROPERTY_ICON_MAP[propertyTypeDetails.iconKey] : undefined,
        propertyDisplayName: property.display_name || "Custom Property",
        rightContent: getAdditionalRightContent(property),
        tooltipContent: getPropertyTooltipContent(property),
        ...operatorConfigs,
      };

      switch (propertyTypeKey) {
        case "TEXT":
          config = getTextPropertyFilterConfig<TCustomPropertyFilterKey>(customPropertyKey)({
            ...commonConfig,
          });
          break;
        case "URL":
          config = getTextPropertyFilterConfig<TCustomPropertyFilterKey>(customPropertyKey)({
            ...commonConfig,
          });
          break;
        case "DECIMAL":
          config = getNumberPropertyFilterConfig<TCustomPropertyFilterKey>(customPropertyKey)({
            ...commonConfig,
          });
          break;
        case "BOOLEAN":
          config = getBooleanPropertyFilterConfig<TCustomPropertyFilterKey>(customPropertyKey)({
            ...commonConfig,
          });
          break;
        case "DATETIME":
          config = getDatePropertyFilterConfig<TCustomPropertyFilterKey>(customPropertyKey)({
            ...commonConfig,
          });
          break;
        case "OPTION":
          config = getDropdownPropertyFilterConfig<TCustomPropertyFilterKey>(customPropertyKey)({
            ...commonConfig,
            customPropertyOptions: property.propertyOptions ?? [],
          });
          break;
        case "RELATION_USER":
          config = getMemberPickerPropertyFilterConfig<TCustomPropertyFilterKey>(customPropertyKey)({
            ...commonConfig,
            members: members,
            getOptionIcon: (memberDetails) => (
              <Avatar
                name={memberDetails.display_name}
                src={getFileURL(memberDetails.avatar_url)}
                showTooltip={false}
                size="sm"
              />
            ),
          });
          break;
        default:
      }

      if (config) {
        configs.push(config);
        configMap[customPropertyKey] = config;
      }
    });

    return { configs, configMap };
  }, [
    customProperties,
    getAdditionalRightContent,
    getPropertyTooltipContent,
    isFilterEnabled,
    members,
    operatorConfigs,
  ]);
