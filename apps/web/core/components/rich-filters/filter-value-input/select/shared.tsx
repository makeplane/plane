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

// plane imports
import type {
  TSupportedFilterFieldConfigs,
  IFilterOption,
  IFilterOptionGroup,
  TFilterValue,
  TWorkItemMeta,
} from "@plane/types";
import { cn, formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
// local imports
import { COMMON_FILTER_ITEM_BORDER_CLASSNAME } from "../../shared";
import { WorkItemsIcon } from "@plane/propel/icons";

type TLoadOptionsProps<V extends TFilterValue> = {
  config: TSupportedFilterFieldConfigs<V>;
  setOptions: (options: IFilterOption<V>[]) => void;
  setGroups?: (groups: IFilterOptionGroup<V>[]) => void;
  setLoading?: (loading: boolean) => void;
};

/**
 * Type guard that distinguishes grouped options from flat options by checking
 * for the `options` array property unique to `IFilterOptionGroup`.
 */
const isFilterOptionGroups = <V extends TFilterValue>(
  result: IFilterOption<V>[] | IFilterOptionGroup<V>[]
): result is IFilterOptionGroup<V>[] => result.length > 0 && "options" in result[0] && Array.isArray(result[0].options);

export const loadOptions = async <V extends TFilterValue>(props: TLoadOptionsProps<V>) => {
  const { config, setOptions, setGroups, setLoading } = props;

  // if the config has a getOptions function, load the options
  if ("getOptions" in config && typeof config.getOptions === "function") {
    setLoading?.(true);
    try {
      const result = await config.getOptions();
      if (isFilterOptionGroups(result)) {
        setGroups?.(result);
        // also keep a flat list for SelectedOptionsDisplay lookups
        setOptions(result.flatMap((group) => group.options));
      } else {
        setOptions(result);
      }
    } catch (error) {
      console.error("Failed to load options:", error);
    } finally {
      setLoading?.(false);
    }
  }
};

export const getFormattedGroupedOptions = <V extends TFilterValue>(groups: IFilterOptionGroup<V>[]) =>
  groups.map((group) => ({
    id: group.id,
    label: group.label,
    options: getFormattedOptions(group.options),
  }));

export const getFormattedOptions = <V extends TFilterValue>(options: IFilterOption<V>[]) =>
  options.map((option) => ({
    value: option.value,
    content: (
      <div className="flex items-center gap-2 transition-all duration-200 ease-in-out">
        {option.icon && (
          <span className={cn("transition-transform duration-200", option.iconClassName)}>{option.icon}</span>
        )}
        <span>{option.label}</span>
      </div>
    ),
    query: option.label.toString().toLowerCase(),
    disabled: option.disabled,
    tooltip: option.description,
  }));

export const getCommonCustomSearchSelectProps = (isDisabled?: boolean) => ({
  customButtonClassName: cn(
    "h-full w-full px-2 text-13 font-regular transition-all duration-300 ease-in-out",
    !isDisabled && COMMON_FILTER_ITEM_BORDER_CLASSNAME,
    isDisabled && "hover:bg-surface-1"
  ),
  optionsClassName: "w-56",
  maxHeight: "md" as const,
});

export const getWorkItemsFilterOptions = (items: TWorkItemMeta[]): IFilterOption<string>[] =>
  items.map((workItem) => ({
    id: workItem.id,
    label: `${formatProjectWorkItemIdentifierForDisplay(workItem.project_identifier, workItem.sequence_id)} ${workItem.name}`,
    value: workItem.id,
    icon: <WorkItemsIcon className="size-3" />,
  }));
