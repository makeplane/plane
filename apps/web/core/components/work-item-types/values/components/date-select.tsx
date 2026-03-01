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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type {
  EIssuePropertyType,
  EIssuePropertyValueError,
  TDateAttributeDisplayOptions,
  TIssueProperty,
  TPropertyValueVariant,
} from "@plane/types";
import { cn, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";

type TDateValueSelectProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType.DATETIME>>;
  value: string[];
  variant: TPropertyValueVariant;
  displayFormat: TDateAttributeDisplayOptions;
  error?: EIssuePropertyValueError;
  isDisabled?: boolean;
  buttonClassName?: string;
  onDateValueChange: (value: string[]) => Promise<void>;
};

export const DateValueSelect = observer(function DateValueSelect(props: TDateValueSelectProps) {
  const {
    propertyDetail,
    value,
    variant,
    displayFormat,
    error,
    isDisabled = false,
    buttonClassName,
    onDateValueChange,
  } = props;
  // states
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    setData(value);
  }, [value]);

  const handleDateChange = (date: Date | null) => {
    const formattedDate = renderFormattedPayloadDate(date);
    const updatedValue = formattedDate ? [formattedDate] : [];
    setData(updatedValue);
    onDateValueChange(updatedValue);
  };

  return (
    <>
      <DateDropdown
        value={data?.[0]}
        onChange={handleDateChange}
        placeholder="Choose date"
        buttonVariant={variant === "update" && !error ? "transparent-with-text" : "border-with-text"}
        disabled={isDisabled}
        className="w-full flex-grow group"
        buttonContainerClassName="w-full text-left"
        buttonClassName={cn(
          "text-sm bg-surface-1",
          {
            "text-placeholder": !data?.length,
            "border-subtle-1": variant === "create",
            "border-danger-strong": Boolean(error),
          },
          buttonClassName
        )}
        hideIcon
        clearIconClassName="h-3 w-3 hidden group-hover:inline"
        formatToken={displayFormat}
      />
      {Boolean(error) && (
        <span className="text-caption-md-medium text-danger-primary">
          {error === "REQUIRED" ? `${propertyDetail.display_name} is required` : error}
        </span>
      )}
    </>
  );
});
