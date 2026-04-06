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
import { cn } from "@plane/utils";
import type { ActivityTab } from "../types";

export type ActivityHeaderProps = {
  tabs: ActivityTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  actionsElement?: ReactNode;
};

export function ActivityHeader(props: ActivityHeaderProps) {
  const { tabs, activeTab, onTabChange, actionsElement } = props;

  return (
    <div className="flex items-center gap-px border-b border-subtle">
      {/* Tab group */}
      <div role="tablist" className="flex flex-1 items-center gap-px min-w-0 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <div key={tab.key} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "h-7 rounded-md px-2 py-0.5 text-body-sm-medium transition-colors",
                  isActive
                    ? "bg-layer-transparent-active text-primary"
                    : "text-tertiary hover:bg-layer-transparent-hover"
                )}
                onClick={() => onTabChange(tab.key)}
              >
                {tab.label}
              </button>
              <div
                className={cn(
                  "h-0.5 w-full rounded-t-sm",
                  isActive ? "bg-(--text-color-icon-primary)" : "bg-transparent"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Right-side actions */}
      {actionsElement && <div className="flex shrink-0 items-center justify-end gap-2">{actionsElement}</div>}
    </div>
  );
}
