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

import { Combobox } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon, InfoIcon } from "@plane/propel/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";
import { Tooltip } from "@plane/propel/tooltip";
import type { ICustomSearchSelectOption } from "@plane/types";
import { cn } from "../utils";
import type { ICustomSearchSelectGroup } from "./helper";

// --------------------------------------------------------------------------
// Single option row (shared by flat and grouped rendering)
// --------------------------------------------------------------------------

type TOptionItemProps = {
  option: ICustomSearchSelectOption;
  multiple: boolean;
  closeDropdown: () => void;
  // When set, replaces option.value in Combobox.Option to avoid cross-group collisions
  scopedValue?: string;
  // When set, overrides Headless UI's selected render prop
  isSelected?: boolean;
};

function OptionItem({ option, multiple, closeDropdown, scopedValue, isSelected }: TOptionItemProps) {
  return (
    <Combobox.Option
      value={scopedValue ?? option.value}
      className={({ active }) =>
        cn(
          "w-full truncate flex items-center justify-between gap-2 rounded-sm px-1 py-1.5 cursor-pointer select-none",
          {
            "bg-layer-transparent-hover": active,
            "text-placeholder opacity-60 cursor-not-allowed": option.disabled,
          }
        )
      }
      onClick={() => {
        if (!multiple) closeDropdown();
      }}
      disabled={option.disabled}
    >
      {({ selected: headlessSelected }) => {
        const selected = isSelected !== undefined ? isSelected : headlessSelected;
        return (
          <>
            <span className="grow truncate">{option.content}</span>
            {selected && <CheckIcon className="size-3.5 shrink-0" />}
            {option.tooltip && (
              <>
                {typeof option.tooltip === "string" ? (
                  <Tooltip tooltipContent={option.tooltip}>
                    <InfoIcon className="size-3.5 shrink-0 cursor-pointer text-secondary" />
                  </Tooltip>
                ) : (
                  option.tooltip
                )}
              </>
            )}
          </>
        );
      }}
    </Combobox.Option>
  );
}

// --------------------------------------------------------------------------
// Flat list
// --------------------------------------------------------------------------

type TFlatOptionsListProps = {
  options: ICustomSearchSelectOption[];
  searchQuery: string;
  isSearchControlled: boolean;
  multiple: boolean;
  closeDropdown: () => void;
  noResultsMessage: string;
};

export function FlatOptionsList({
  options,
  searchQuery,
  isSearchControlled,
  multiple,
  closeDropdown,
  noResultsMessage,
}: TFlatOptionsListProps) {
  const filtered =
    isSearchControlled || searchQuery === ""
      ? options
      : options.filter((o) => o.query.toLowerCase().includes(searchQuery.toLowerCase()));

  if (filtered.length === 0) {
    return <p className="text-placeholder italic py-1 px-1.5">{noResultsMessage}</p>;
  }

  return (
    <>
      {filtered.map((option) => (
        <OptionItem key={option.value} option={option} multiple={multiple} closeDropdown={closeDropdown} />
      ))}
    </>
  );
}

// --------------------------------------------------------------------------
// Grouped list
// --------------------------------------------------------------------------

type TGroupedOptionsListProps = {
  groups: ICustomSearchSelectGroup[];
  searchQuery: string;
  isSearchControlled: boolean;
  multiple: boolean;
  closeDropdown: () => void;
  noResultsMessage: string;
  comboboxValue?: string | string[] | null;
};

export function GroupedOptionsList({
  groups,
  searchQuery,
  isSearchControlled,
  multiple,
  closeDropdown,
  noResultsMessage,
  comboboxValue,
}: TGroupedOptionsListProps) {
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      options:
        isSearchControlled || searchQuery === ""
          ? group.options
          : group.options.filter((o) => o.query.toLowerCase().includes(searchQuery.toLowerCase())),
    }))
    .filter((group) => group.options.length > 0);

  if (filteredGroups.length === 0) {
    return <p className="text-placeholder italic py-1 px-1.5">{noResultsMessage}</p>;
  }

  return (
    <>
      {filteredGroups.map((group) => (
        <GroupSection
          key={group.id}
          group={group}
          multiple={multiple}
          closeDropdown={closeDropdown}
          comboboxValue={comboboxValue}
        />
      ))}
    </>
  );
}

// --------------------------------------------------------------------------
// Individual group section with collapsible
// --------------------------------------------------------------------------

// Separator unlikely to appear in any real option value or group ID
const GROUP_SCOPE_SEPARATOR = "\x1f";

export const scopeGroupOptionValue = (groupId: string, optionValue: string) =>
  `${groupId}${GROUP_SCOPE_SEPARATOR}${optionValue}`;

export const unscopeGroupOptionValue = (scopedValue: string) => {
  const idx = scopedValue.indexOf(GROUP_SCOPE_SEPARATOR);
  return idx >= 0 ? scopedValue.slice(idx + 1) : scopedValue;
};

type TGroupSectionProps = {
  group: ICustomSearchSelectGroup;
  multiple: boolean;
  closeDropdown: () => void;
  comboboxValue?: string | string[] | null;
};

function GroupSection({ group, multiple, closeDropdown, comboboxValue }: TGroupSectionProps) {
  return (
    <Collapsible defaultOpen className="py-1 last:border-b-0 border-b border-subtle">
      <CollapsibleTrigger className="group w-full flex items-center justify-between gap-1.5 px-1 py-1.5 rounded-sm hover:bg-layer-transparent-hover text-caption-md-regular! font-regular text-tertiary select-none">
        <span className="truncate">{group.label}</span>
        <span className="shrink-0 size-4 grid place-items-center">
          <ChevronDownIcon className="size-3.5 transition-transform duration-200 -rotate-90 group-data-[panel-open]:rotate-0" />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {group.options.map((option) => {
          const isSelected = Array.isArray(comboboxValue)
            ? comboboxValue.includes(option.value)
            : comboboxValue === option.value;
          return (
            <OptionItem
              key={option.value}
              option={option}
              multiple={multiple}
              closeDropdown={closeDropdown}
              scopedValue={scopeGroupOptionValue(group.id, option.value)}
              isSelected={isSelected}
            />
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
