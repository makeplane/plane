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
import { SlidersHorizontal } from "lucide-react";
// plane imports
import { SPREADSHEET_PROPERTY_LIST, SPREADSHEET_PROPERTY_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Combobox } from "@plane/propel/combobox";
import type { IIssueDisplayProperties, TIssuePropertyTypeIconKey, TLogoProps } from "@plane/types";
import { EWorkItemTypeEntity } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { IssueTypeLogo } from "@/components/work-item-types/common/issue-type-logo";
import { PropertyTypeIcon } from "@/components/work-item-types/properties/property-icon";
// helpers
import type { TSpreadsheetPropertyIconKey } from "@/helpers/work-item-layout/display-properties";
import { SpreadSheetPropertyIconMap } from "@/helpers/work-item-layout/display-properties";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useCustomers, useFeatureFlags, useIssueTypes } from "@/plane-web/hooks/store";

type CustomPropertyItem = {
  id: string;
  displayName: string;
  iconName: string | undefined;
  issueTypeLogoProps: TLogoProps["icon"] | undefined;
};

export type SpreadsheetColumnsToggleProps = {
  workspaceSlug: string;
  projectIds: string[];
  displayProperties: IIssueDisplayProperties;
  handleDisplayPropertiesUpdate: (property: Partial<IIssueDisplayProperties>) => void;
  isEstimateEnabled: boolean;
  isEpic?: boolean;
};

const CUSTOM_PREFIX = "custom:";

export const SpreadsheetColumnsToggle = observer(function SpreadsheetColumnsToggle(
  props: SpreadsheetColumnsToggleProps
) {
  const {
    workspaceSlug,
    projectIds,
    displayProperties,
    handleDisplayPropertiesUpdate,
    isEstimateEnabled,
    isEpic = false,
  } = props;

  const { t } = useTranslation();
  const { currentProjectDetails } = useProject();
  const { isCustomersFeatureEnabled } = useCustomers();
  const { getProjectIssueTypes, isWorkItemTypeEntityEnabledForProject } = useIssueTypes();
  const { getFeatureFlag } = useFeatureFlags();

  const isWorkspaceLevel = projectIds.length > 1;

  // Build filtered built-in properties list
  const builtInProperties = SPREADSHEET_PROPERTY_LIST.filter((key) => {
    if (isEpic && (key === "cycle" || key === "modules")) return false;
    if (key === "cycle" && !isWorkspaceLevel && !currentProjectDetails?.cycle_view) return false;
    if (key === "modules" && !isWorkspaceLevel && !currentProjectDetails?.module_view) return false;
    if (key === "estimate" && !isEstimateEnabled) return false;
    if ((key === "customer_count" || key === "customer_request_count") && !isCustomersFeatureEnabled) return false;
    return true;
  });

  // Collect all custom properties across issue types, including icon and issue type info.
  // Computed directly (not memoized) so MobX observer can track activeProperties changes
  // and re-render when property data is fetched asynchronously.
  const customProperties = (() => {
    if (!workspaceSlug || isEpic || projectIds.length === 0) return [];

    const spreadsheetCustomPropertyFlag = getFeatureFlag(workspaceSlug, "SPREADSHEET_CUSTOM_PROPERTIES", false);
    if (!spreadsheetCustomPropertyFlag) return [];

    const seenIds = new Set<string>();
    const properties: CustomPropertyItem[] = [];

    for (const pid of projectIds) {
      const isEnabled = isWorkItemTypeEntityEnabledForProject(workspaceSlug, pid, EWorkItemTypeEntity.WORK_ITEM);
      if (!isEnabled) continue;

      const projectIssueTypes = getProjectIssueTypes(pid, true);
      if (!projectIssueTypes) continue;

      Object.values(projectIssueTypes).forEach((issueType) => {
        issueType.activeProperties.forEach((property) => {
          if (property.id && !seenIds.has(property.id)) {
            seenIds.add(property.id);
            properties.push({
              id: property.id,
              displayName: property.display_name || property.id,
              iconName: property.logo_props?.icon?.name,
              issueTypeLogoProps: issueType.logo_props?.icon,
            });
          }
        });
      });
    }

    return properties;
  })();

  // Build selected set for quick lookup — computed directly (not memoized)
  // so that MobX observer can track displayProperties access and trigger re-renders
  const selectedSet = new Set<string>();

  // Built-in properties
  builtInProperties.forEach((key) => {
    if (displayProperties[key]) selectedSet.add(key);
  });

  // Custom properties
  customProperties.forEach((prop) => {
    const key = `customproperty_${prop.id}` as keyof IIssueDisplayProperties;
    if (displayProperties[key] !== false) selectedSet.add(`${CUSTOM_PREFIX}${prop.id}`);
  });

  const selectedValues = Array.from(selectedSet);

  // Search state — filtering is handled here, not in Propel
  const [searchQuery, setSearchQuery] = useState("");
  const searchLower = searchQuery.toLowerCase();

  const filteredBuiltInProperties = searchQuery
    ? builtInProperties.filter((key) => {
        const details = SPREADSHEET_PROPERTY_DETAILS[key];
        const label = details ? t(details.i18n_title) : key;
        return label.toLowerCase().includes(searchLower);
      })
    : builtInProperties;

  const filteredCustomProperties = searchQuery
    ? customProperties.filter((prop) => prop.displayName.toLowerCase().includes(searchLower))
    : customProperties;

  const handleValueChange = (newValue: string | string[] | null) => {
    const newSelectedIds = new Set(Array.isArray(newValue) ? newValue : newValue ? [newValue] : []);

    // Check built-in properties for changes
    builtInProperties.forEach((key) => {
      const wasVisible = !!displayProperties[key];
      const isNowVisible = newSelectedIds.has(key);

      if (wasVisible !== isNowVisible) {
        handleDisplayPropertiesUpdate({ [key]: isNowVisible });
      }
    });

    // Check custom properties for changes
    customProperties.forEach((prop) => {
      const key = `customproperty_${prop.id}` as const;
      const valueId = `${CUSTOM_PREFIX}${prop.id}`;
      const wasVisible = displayProperties[key] !== false;
      const isNowVisible = newSelectedIds.has(valueId);

      if (wasVisible !== isNowVisible) {
        handleDisplayPropertiesUpdate({ [key]: isNowVisible });
      }
    });
  };

  return (
    <Combobox value={selectedValues} onValueChange={handleValueChange} multiSelect>
      <Combobox.Button className="flex items-center justify-center rounded-md size-7 hover:bg-layer-transparent-hover">
        <SlidersHorizontal className="size-4 text-secondary" />
      </Combobox.Button>
      <Combobox.Options
        showSearch
        searchPlaceholder={t("search")}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        maxHeight="lg"
        className="w-[258px] overflow-hidden rounded-lg border border-subtle-1 bg-layer-2 p-0 shadow-overlay-200"
        inputClassName="w-full border-0 border-b border-subtle rounded-none bg-transparent py-1.5 pl-8 pr-2 text-13 text-secondary placeholder:text-placeholder focus:outline-none"
        optionsContainerClassName="p-1"
        positionerClassName="z-50"
        dataPreventOutsideClick
      >
        {/* Built-in properties section */}
        {filteredBuiltInProperties.length > 0 && (
          <>
            <div className="px-2 pt-2 pb-1 text-body-sm-regular text-placeholder">{t("common.properties")}</div>
            {filteredBuiltInProperties.map((key) => {
              const details = SPREADSHEET_PROPERTY_DETAILS[key];
              const IconComponent = details
                ? SpreadSheetPropertyIconMap[details.icon as TSpreadsheetPropertyIconKey]
                : null;
              const isSelected = selectedSet.has(key);

              return (
                <Combobox.Option
                  key={key}
                  value={key}
                  className="w-full flex items-center gap-1.5 rounded-md cursor-pointer select-none px-2 py-1.5 hover:bg-layer-transparent-hover"
                >
                  <CheckboxIndicator isSelected={isSelected} />
                  {IconComponent ? (
                    <IconComponent className="size-4 shrink-0 text-secondary" />
                  ) : (
                    <span className="size-4 shrink-0" />
                  )}
                  <span className="flex-1 truncate text-body-xs-regular text-primary">
                    {details ? t(details.i18n_title) : key}
                  </span>
                </Combobox.Option>
              );
            })}
          </>
        )}

        {/* Custom properties section */}
        {filteredCustomProperties.length > 0 && (
          <>
            <div className="px-2 pt-2 pb-1 text-body-sm-regular text-placeholder">
              {t("work_item_types.settings.linked_properties.title")}
            </div>
            {filteredCustomProperties.map((prop) => (
              <Combobox.Option
                key={prop.id}
                value={`${CUSTOM_PREFIX}${prop.id}`}
                className="w-full flex items-center gap-1.5 rounded-md cursor-pointer select-none px-2 py-1.5 hover:bg-layer-transparent-hover"
              >
                <PropertyOptionRow property={prop} isSelected={selectedSet.has(`${CUSTOM_PREFIX}${prop.id}`)} />
              </Combobox.Option>
            ))}
          </>
        )}

        {/* No results */}
        {searchQuery && filteredBuiltInProperties.length === 0 && filteredCustomProperties.length === 0 && (
          <div className="px-2 py-1.5 text-13 text-placeholder">{t("common.no_results_found")}</div>
        )}
      </Combobox.Options>
    </Combobox>
  );
});

function CheckboxIndicator({ isSelected }: { isSelected: boolean }) {
  return (
    <span
      className={cn(
        "relative grid place-items-center size-4 shrink-0 rounded-[3px] border",
        isSelected ? "bg-accent-primary border-none" : "border-strong bg-transparent"
      )}
    >
      {isSelected && (
        <svg
          className="size-4 p-0.5 text-on-color pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
  );
}

// Separate component to render each property option row content
const PropertyOptionRow = observer(function PropertyOptionRow({
  property,
  isSelected,
}: {
  property: CustomPropertyItem;
  isSelected: boolean;
}) {
  const iconKey = property.iconName as TIssuePropertyTypeIconKey | undefined;

  return (
    <>
      <CheckboxIndicator isSelected={isSelected} />
      {/* Property type icon */}
      {iconKey ? (
        <PropertyTypeIcon iconKey={iconKey} className="size-4 shrink-0 text-secondary" />
      ) : (
        <span className="size-4 shrink-0" />
      )}
      {/* Property name */}
      <span className="flex-1 truncate text-body-xs-regular text-primary">{property.displayName}</span>
      {/* Work item type badge icon */}
      <IssueTypeLogo icon_props={property.issueTypeLogoProps} size="xs" />
    </>
  );
});
