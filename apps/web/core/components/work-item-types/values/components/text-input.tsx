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

import React, { useEffect, useState } from "react";
import { isEqual } from "lodash-es";
import { observer } from "mobx-react";
// ui
import type {
  EIssuePropertyType,
  EIssuePropertyValueError,
  TIssueProperty,
  TPropertyValueVariant,
  TTextAttributeDisplayOptions,
} from "@plane/types";
import { Input, TextArea } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// plane imports

type TTextValueInputProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType.TEXT>>;
  value: string[];
  variant: TPropertyValueVariant;
  display_format: TTextAttributeDisplayOptions;
  readOnlyData?: string;
  error?: EIssuePropertyValueError;
  className?: string;
  isDisabled?: boolean;
  onTextValueChange: (value: string[]) => void;
};

export const TextValueInput = observer(function TextValueInput(props: TTextValueInputProps) {
  const {
    propertyDetail,
    value,
    variant,
    display_format = "single-line",
    readOnlyData,
    error,
    className = "",
    isDisabled = false,
    onTextValueChange,
  } = props;
  // states
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    setData(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setData([newValue]);
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setData([newValue]);
  };

  const commonClassNames = cn(
    "w-full px-2 resize-none text-body-xs-regular bg-surface-1 rounded-sm border-0",
    {
      "border-[0.5px]": variant === "create",
      "border-[1px] bg-layer-1": variant === "update",
      "cursor-not-allowed": isDisabled,
    },
    className
  );

  const handleTextValueChange = () => {
    // trim and filter empty values
    const trimmedValue = data.map((val) => val.trim()).filter((val) => val);
    // update property data
    if (!isEqual(value, trimmedValue)) {
      onTextValueChange(trimmedValue);
    }
  };

  switch (display_format) {
    case "single-line":
      return (
        <>
          <Input
            id={`single_line_text_${propertyDetail.id}`}
            type="text"
            value={data?.[0] ?? ""}
            onChange={handleInputChange}
            className={commonClassNames}
            onClick={() => {
              // add data-delay-outside-click to delay the dropdown from closing so that data can be synced
              document.body?.setAttribute("data-delay-outside-click", "true");
            }}
            onBlur={() => {
              handleTextValueChange();
              document.body?.removeAttribute("data-delay-outside-click");
            }}
            placeholder="Add text"
            hasError={Boolean(error)}
            disabled={isDisabled}
          />
          {Boolean(error) && (
            <span className="text-caption-md-medium text-danger-primary">
              {error === "REQUIRED" ? `${propertyDetail.display_name} is required` : error}
            </span>
          )}
        </>
      );
    case "multi-line":
      return (
        <>
          <TextArea
            id={`multi_line_text_${propertyDetail.id}`}
            value={data?.[0] ?? ""}
            onChange={handleTextAreaChange}
            className={cn(
              commonClassNames,
              "max-h-52 vertical-scrollbar scrollbar-xs",
              variant === "create" && "min-h-28"
            )}
            onClick={() => {
              // add data-delay-outside-click to delay the dropdown from closing so that data can be synced
              document.body?.setAttribute("data-delay-outside-click", "true");
            }}
            onBlur={() => {
              handleTextValueChange();
              document.body?.removeAttribute("data-delay-outside-click");
            }}
            placeholder="Describe..."
            hasError={Boolean(error)}
            disabled={isDisabled}
          />
          {Boolean(error) && (
            <span className="text-caption-md-medium text-danger-primary">
              {error === "REQUIRED" ? `${propertyDetail.display_name} is required` : error}
            </span>
          )}
        </>
      );
    case "readonly":
      return (
        <TextArea
          id={`readonly_text_${propertyDetail.id}`}
          value={readOnlyData ?? "No data"}
          className={cn(commonClassNames, "bg-layer-1 text-primary border-strong-1 cursor-default")}
          readOnly
          disabled={isDisabled}
        />
      );
  }
});
