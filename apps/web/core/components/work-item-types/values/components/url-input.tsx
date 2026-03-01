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
import { NewTabIcon, EditIcon } from "@plane/propel/icons";
// ui
import type { EIssuePropertyType, EIssuePropertyValueError, TIssueProperty, TPropertyValueVariant } from "@plane/types";
import { Input } from "@plane/ui";
// helpers
import { cn, extractURLComponents } from "@plane/utils";
import { TruncatedUrl } from "./truncated-url";

type TUrlValueInputProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType.URL>>;
  value: string[];
  variant: TPropertyValueVariant;
  error?: EIssuePropertyValueError;
  className?: string;
  isDisabled?: boolean;
  onTextValueChange: (value: string[]) => void;
};

export const UrlValueInput = observer(function UrlValueInput(props: TUrlValueInputProps) {
  const { propertyDetail, value, variant, error, className = "", isDisabled = false, onTextValueChange } = props;

  // states
  const [data, setData] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const urlComponents = data?.[0] ? extractURLComponents(data?.[0]) : undefined;

  useEffect(() => {
    setData(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData([e.target.value]);
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

  const handleUrlValueChange = () => {
    const trimmedValue = data.map((val) => val.trim()).filter(Boolean);
    if (!isEqual(value, trimmedValue)) {
      onTextValueChange(trimmedValue);
    }
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        className={cn("group flex items-center justify-between gap-4 px-2 py-1.5 rounded-sm outline-none", {
          "cursor-not-allowed": isDisabled,
          "hover:bg-layer-1": !isDisabled,
          "bg-layer-1": isEditing,
        })}
        onClick={() => !isDisabled && setIsEditing(true)}
        disabled={isDisabled}
      >
        {urlComponents ? (
          <TruncatedUrl url={urlComponents} />
        ) : data?.[0] ? (
          <span className="text-body-xs-regular text-tertiary">{data?.[0]}</span>
        ) : (
          <span className="text-body-xs-regular text-placeholder">Add URL</span>
        )}
        {!isEditing && (
          <div className="flex items-center gap-1 group-hover:opacity-100">
            {urlComponents && (
              <a
                href={urlComponents.full.toString()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 rounded-sm bg-layer-1 hover:bg-surface-1"
                onClick={(e) => e.stopPropagation()}
              >
                <NewTabIcon className="h-2.5 w-2.5 flex-shrink-0" />
              </a>
            )}

            <button className="p-1 flex-shrink-0  text-placeholder">
              <EditIcon className="h-2.5 w-2.5 flex-shrink-0" />
            </button>
          </div>
        )}
      </button>
    );
  }

  return (
    <>
      <Input
        id={`single_line_url_${propertyDetail.id}`}
        type="url"
        value={data?.[0] ?? ""}
        onChange={handleInputChange}
        className={commonClassNames}
        onClick={() => {
          document.body?.setAttribute("data-delay-outside-click", "true");
        }}
        onBlur={() => {
          handleUrlValueChange();
          document.body?.removeAttribute("data-delay-outside-click");
        }}
        placeholder="Add URL"
        hasError={Boolean(error)}
        disabled={isDisabled}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleUrlValueChange();
          }
          e.stopPropagation();
        }}
      />
      {Boolean(error) && (
        <span className="text-caption-md-medium text-danger-primary">
          {error === "REQUIRED" ? `${propertyDetail.display_name} is required` : error}
        </span>
      )}
    </>
  );
});
