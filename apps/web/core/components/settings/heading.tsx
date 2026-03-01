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
import { cn } from "@plane/ui";

type Props = {
  className?: string;
  control?: React.ReactNode;
  description?: React.ReactNode;
  title?: React.ReactNode;
  variant?: "h3" | "h4" | "h6";
};

export function SettingsHeading({ className, control, description, title, variant = "h3" }: Props) {
  return (
    <div className={cn("flex flex-col md:flex-row gap-4 items-start md:items-center justify-between", className)}>
      <div className="flex flex-col items-start gap-1">
        {typeof title === "string" ? (
          <h3
            className={cn("text-h3-medium text-primary", {
              "text-h3-medium": variant === "h3",
              "text-h4-medium": variant === "h4",
              "text-h6-medium": variant === "h6",
            })}
          >
            {title}
          </h3>
        ) : (
          title
        )}
        {description && <p className="text-body-xs-regular text-tertiary">{description}</p>}
      </div>
      {control}
    </div>
  );
}
