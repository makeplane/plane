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

import { useMemo } from "react";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIdentifierTextProps, TIdentifierTextVariant, TIssueIdentifierSize } from "@plane/types";
import { cn, formatProjectIdentifierForDisplay } from "@plane/utils";

const SIZE_MAP: Record<TIssueIdentifierSize, string> = {
  xs: "text-caption-sm-regular",
  sm: "text-caption-sm-medium",
  md: "text-caption-md-medium",
  lg: "text-caption-lg-medium",
};

const VARIANT_MAP: Record<TIdentifierTextVariant, string> = {
  default: "text-tertiary",
  secondary: "text-secondary",
  tertiary: "text-tertiary",
  primary: "text-primary",
  "primary-subtle": "text-primary/80",
  success: "text-success-primary",
};

export function IdentifierText(props: TIdentifierTextProps) {
  const { identifier, enableClickToCopyIdentifier = false, size = "lg", variant = "default" } = props;
  const displayIdentifier = formatProjectIdentifierForDisplay(identifier);
  const isIdentifierTruncated = displayIdentifier !== identifier;
  const tooltipContent = useMemo(() => {
    if (isIdentifierTruncated && enableClickToCopyIdentifier) {
      return (
        <div className="space-y-1">
          <div>{identifier}</div>
          <div className="text-tertiary">Click to copy</div>
        </div>
      );
    } else if (isIdentifierTruncated) {
      return identifier;
    } else if (enableClickToCopyIdentifier) {
      return "Click to copy";
    } else {
      return undefined;
    }
  }, [isIdentifierTruncated, enableClickToCopyIdentifier, identifier]);
  // handlers
  const handleCopyIssueIdentifier = () => {
    if (enableClickToCopyIdentifier) {
      navigator.clipboard
        .writeText(identifier)
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Work item ID copied to clipboard",
          });
          return;
        })
        .catch(() => {
          console.error("Failed to copy work item ID");
        });
    }
  };

  const textSizeClassName = SIZE_MAP[size];
  const variantClassName = VARIANT_MAP[variant];

  return (
    <Tooltip tooltipContent={tooltipContent} disabled={!tooltipContent} position="top">
      <button
        type="button"
        className={cn(
          "font-medium whitespace-nowrap text-secondary text-body-sm-medium",
          textSizeClassName,
          variantClassName,
          {
            "cursor-pointer": enableClickToCopyIdentifier,
          }
        )}
        onClick={handleCopyIssueIdentifier}
        disabled={!enableClickToCopyIdentifier}
      >
        {displayIdentifier}
      </button>
    </Tooltip>
  );
}
