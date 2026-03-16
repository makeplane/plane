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
import { CheckIcon, ReleaseStateIcon } from "@plane/propel/icons";
import { RELEASE_STATES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TButtonSize } from "@plane/propel/button";
import { Combobox } from "@plane/propel/combobox";
import { cn } from "@plane/utils";
import type { ReleaseStatus } from "@plane/types";

export type ReleaseStateDropdownProps = {
  value: ReleaseStatus;
  onChange?: (value: ReleaseStatus) => void;
  disabled?: boolean;
  buttonClassName?: string;
  className?: string;
  tabIndex?: number;
  placeholder?: string;
  readonly?: boolean;
  size?: TButtonSize;
};

export const ReleaseStateDropdown = observer(function ReleaseStateDropdown(props: ReleaseStateDropdownProps) {
  const {
    value,
    onChange,
    disabled = false,
    buttonClassName = "",
    className = "",
    placeholder = "Select state",
    readonly = false,
    size = "base",
  } = props;

  const { t } = useTranslation();

  const stateOptions = Object.values(RELEASE_STATES).map((state) => ({
    value: state.key,
    query: state.title,
    content: (
      <div className="flex items-center gap-2">
        <ReleaseStateIcon className="h-3.5 w-3.5 flex-shrink-0" color={state.color} />
        <span className="flex-grow truncate text-left text-11">{state.title}</span>
      </div>
    ),
  }));

  const sizeConfig: Record<TButtonSize, { icon: string; dropdown: string; optionPadding: string }> = {
    sm: { icon: "h-3 w-3", dropdown: "w-40 text-11", optionPadding: "px-1 py-1" },
    base: { icon: "h-4 w-4", dropdown: "w-48 text-11", optionPadding: "px-1 py-1.5" },
    lg: { icon: "h-4 w-4", dropdown: "w-56 text-13", optionPadding: "px-2 py-2" },
    xl: { icon: "h-5 w-5", dropdown: "w-64 text-13", optionPadding: "px-2 py-2.5" },
  };

  const selectedState = stateOptions.find((option) => option.value === value);
  const currentSize = sizeConfig[size];

  const handleValueChange = (newValue: string | string[] | null) => {
    if (typeof newValue === "string" && newValue in RELEASE_STATES) {
      onChange?.(newValue as ReleaseStatus);
    }
  };

  return (
    <div className={cn("contain-layout", className)}>
      <Combobox value={value} onValueChange={handleValueChange} disabled={disabled || readonly}>
        <Combobox.Button>
          <Button
            variant="secondary"
            size={size}
            className={cn(
              "w-full justify-between bg-layer-transparent hover:bg-layer-transparent-hover",
              buttonClassName
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              {selectedState ? (
                <>
                  <ReleaseStateIcon
                    className="h-3.5 w-3.5 flex-shrink-0"
                    color={RELEASE_STATES[value as keyof typeof RELEASE_STATES]?.color}
                  />
                  <span className="flex-grow truncate">{selectedState.query}</span>
                </>
              ) : (
                <span className="text-placeholder">{placeholder}</span>
              )}
            </div>
          </Button>
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
