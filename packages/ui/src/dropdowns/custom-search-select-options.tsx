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
};

function OptionItem({ option, multiple, closeDropdown }: TOptionItemProps) {
  return (
    <Combobox.Option
      value={option.value}
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
      {({ selected }) => (
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
      )}
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
};

export function GroupedOptionsList({
  groups,
  searchQuery,
  isSearchControlled,
  multiple,
  closeDropdown,
  noResultsMessage,
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
        <GroupSection key={group.id} group={group} multiple={multiple} closeDropdown={closeDropdown} />
      ))}
    </>
  );
}

// --------------------------------------------------------------------------
// Individual group section with collapsible
// --------------------------------------------------------------------------

type TGroupSectionProps = {
  group: ICustomSearchSelectGroup;
  multiple: boolean;
  closeDropdown: () => void;
};

function GroupSection({ group, multiple, closeDropdown }: TGroupSectionProps) {
  return (
    <Collapsible defaultOpen className="py-1 last:border-b-0 border-b border-subtle">
      <CollapsibleTrigger className="group w-full flex items-center justify-between gap-1.5 px-1 py-1.5 rounded-sm hover:bg-layer-transparent-hover text-caption-md-regular! font-regular text-tertiary select-none">
        <span className="truncate">{group.label}</span>
        <span className="shrink-0 size-4 grid place-items-center">
          <ChevronDownIcon className="size-3.5 transition-transform duration-200 -rotate-90 group-data-[panel-open]:rotate-0" />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {group.options.map((option) => (
          <OptionItem key={option.value} option={option} multiple={multiple} closeDropdown={closeDropdown} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
