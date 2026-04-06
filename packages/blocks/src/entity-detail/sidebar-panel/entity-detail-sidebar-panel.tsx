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

import type { ReactNode } from "react";

export type EntityDetailSidebarPanelProps = {
  title: string;
  subtitle?: string;
  subtitleTooltip?: ReactNode;
  children: ReactNode;
};

export function EntityDetailSidebarPanel(props: EntityDetailSidebarPanelProps) {
  const { title, subtitle, subtitleTooltip, children } = props;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface-1">
      <div className="h-full w-full overflow-y-auto px-6 py-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between w-full">
            <h5 className="text-body-sm-semibold text-primary">{title}</h5>
            {subtitle && (
              <div className="flex items-center gap-1.5">
                <span className="text-caption-md-regular text-placeholder">{subtitle}</span>
                {subtitleTooltip}
              </div>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
