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

import type { FC } from "react";
import { observer } from "mobx-react";
import { CheckIcon, InitiativeStateIcon } from "@plane/propel/icons";
// plane imports
import { INITIATIVE_STATES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Combobox } from "@plane/propel/combobox";
import type { TInitiativeStates } from "@plane/types";
import { cn } from "@plane/utils";

// types
export type TInitiativeStateDropdownProps = {
  value: TInitiativeStates;
  onChange?: (value: TInitiativeStates) => void;
  disabled?: boolean;
  buttonClassName?: string;
  className?: string;
  tabIndex?: number;
  showTooltip?: boolean;
  placeholder?: string;
  readonly?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
};

export const InitiativeStateDropdown = observer(function InitiativeStateDropdown(props: TInitiativeStateDropdownProps) {
  const {
    value,
    onChange,
    disabled = false,
    buttonClassName = "",
    className = "",
    placeholder = "Select state",
    readonly = false,
    size = "sm",
  } = props;

  // plane hooks
  const { t } = useTranslation();

  const stateOptions = Object.values(INITIATIVE_STATES).map((state) => ({
    value: state.key,
    query: state.title,
    content: (
      <div className="flex items-center gap-2">
        <InitiativeStateIcon state={state.key} className="h-4 w-4 flex-shrink-0" />
        <span className="flex-grow truncate text-left text-11">{state.title}</span>
      </div>
    ),
  }));

  const sizeConfig = {
    xs: {
      button: "h-6 px-1.5 py-0.5 text-11 gap-1",
      icon: "h-3 w-3",
      dropdown: "w-40 text-11",
      optionPadding: "px-1 py-1",
    },
    sm: {
      button: "h-7 px-2 py-1 text-11 gap-1",
      icon: "h-4 w-4",
      dropdown: "w-48 text-11",
      optionPadding: "px-1 py-1.5",
    },
    md: {
      button: "h-8 px-2.5 py-1.5 text-13 gap-2",
      icon: "h-4 w-4",
      dropdown: "w-56 text-13",
      optionPadding: "px-2 py-2",
    },
    lg: {
      button: "h-10 px-3 py-2 text-13 gap-2",
      icon: "h-5 w-5",
      dropdown: "w-64 text-13",
      optionPadding: "px-2 py-2.5",
    },
  };

  const selectedState = stateOptions.find((option) => option.value === value);
  const currentSize = sizeConfig[size];

  const handleValueChange = (newValue: string | string[]) => {
    if (typeof newValue === "string") {
      onChange?.(newValue as TInitiativeStates);
    }
  };

  return (
    <div className={cn("contain-layout", className)}>
      <Combobox value={value} onValueChange={(value) => handleValueChange(value ?? "")} disabled={disabled || readonly}>
        <Combobox.Button
          className={cn(
            "flex h-full w-full items-center justify-between gap-1 rounded-sm border border-subtle-1 px-2 py-1 text-11 hover:bg-layer-1-hover",
            currentSize.button,
            buttonClassName
          )}
          disabled={disabled || readonly}
        >
          <div className="flex items-center gap-2">
            {selectedState ? (
              <>
                {value ? <InitiativeStateIcon state={value} className="h-4 w-4 flex-shrink-0" /> : null}
                <span className="flex-grow truncate">{selectedState.query}</span>
              </>
            ) : (
              <span className="text-placeholder">{placeholder}</span>
            )}
          </div>
        </Combobox.Button>
        <Combobox.Options
          showSearch
          searchPlaceholder={t("search")}
          emptyMessage={t("no_matching_results")}
          maxHeight="md"
          className={cn(
            "rounded-sm border-[0.5px] border-subtle-1 bg-surface-1 px-2 py-2.5 shadow-raised-200",
            currentSize.dropdown
          )}
          inputClassName="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
          optionsContainerClassName="mt-2 space-y-1"
          positionerClassName="z-50"
          dataPreventOutsideClick
        >
          {stateOptions.map((option) => (
            <Combobox.Option
              key={option.value}
              value={option.value}
              className={cn(
                "w-full truncate flex items-center justify-between gap-2 rounded-sm cursor-pointer select-none hover:bg-layer-1-hover data-[selected]:text-primary text-secondary",
                currentSize.optionPadding
              )}
            >
              <span className="flex-grow truncate">{option.content}</span>
              {option.value === value && <CheckIcon className={cn(currentSize.icon, "flex-shrink-0")} />}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    </div>
  );
});
