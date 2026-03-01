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
import { CustomSearchSelect } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import useTimezone from "@/hooks/use-timezone";

type TTimezoneSelect = {
  value: string | undefined;
  onChange: (value: string) => void;
  error?: boolean;
  label?: string;
  buttonClassName?: string;
  className?: string;
  optionsClassName?: string;
  disabled?: boolean;
};

export const TimezoneSelect = observer(function TimezoneSelect(props: TTimezoneSelect) {
  // props
  const {
    value,
    onChange,
    error = false,
    label = "Select a timezone",
    buttonClassName = "",
    className = "",
    optionsClassName = "",
    disabled = false,
  } = props;
  // hooks
  const { disabled: isDisabled, timezones, selectedValue } = useTimezone();

  return (
    <div>
      <CustomSearchSelect
        value={value}
        label={value && selectedValue ? selectedValue(value) : label}
        options={isDisabled || disabled ? [] : timezones}
        onChange={onChange}
        buttonClassName={cn(buttonClassName, "border border-subtle-1", {
          "border-danger-strong": error,
        })}
        className={cn("rounded-md", className)}
        optionsClassName={cn("w-72", optionsClassName)}
        input
        disabled={isDisabled || disabled}
        placement="bottom-end"
      />
    </div>
  );
});
