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

import { cn } from "@plane/utils";

type TIdentitySettingsSubSectionProps = {
  subsectionTitle: string;
  subsectionDescription: string;
  action: React.ReactNode;
  logo?: {
    src: string;
    alt: string;
    className?: string;
  };
  children?: React.ReactNode;
  showBorder?: boolean;
};

export function IdentitySettingsSubSection(props: TIdentitySettingsSubSectionProps) {
  const { subsectionTitle, subsectionDescription, action, logo, children, showBorder = false } = props;

  return (
    <>
      <div
        className={cn("flex flex-col md:flex-row gap-2 items-start md:items-center justify-between", {
          "border-b border-subtle pb-4": showBorder,
        })}
      >
        <div className={cn("flex", logo ? "items-center gap-3" : "flex-col gap-0.5")}>
          {logo && (
            <div className="flex-shrink-0 size-10 rounded-lg bg-layer-1 flex items-center justify-center p-1.5">
              <img src={logo.src} alt={logo.alt} className={cn("w-7", logo.className)} />
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <div className="text-body-sm-medium text-primary">{subsectionTitle}</div>
            <div className="text-body-xs-regular text-tertiary">{subsectionDescription}</div>
          </div>
        </div>
        {action}
      </div>
      {children}
    </>
  );
}
