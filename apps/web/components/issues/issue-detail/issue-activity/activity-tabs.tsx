/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
// plane imports
import { cn } from "@plane/utils";

export type TActivityTab<K extends string = string> = {
  key: K;
  label: string;
};

type Props<K extends string> = {
  tabs: TActivityTab<K>[];
  activeTab: K;
  onTabChange: (key: K) => void;
  /** Id prefix used to link each tab with the panel it controls. */
  idPrefix: string;
  /** Accessible name of the tab list. */
  ariaLabel: string;
  actionsElement?: ReactNode;
};

export const getActivityTabId = (idPrefix: string, key: string) => `${idPrefix}-tab-${key}`;
export const getActivityTabPanelId = (idPrefix: string) => `${idPrefix}-panel`;

/** Underlined tab row for the activity section, with trailing actions (sort, filter). */
export function ActivityTabs<K extends string>(props: Props<K>) {
  const { tabs, activeTab, onTabChange, idPrefix, ariaLabel, actionsElement } = props;
  // refs
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    tabRefs.current[nextIndex]?.focus();
    onTabChange(tabs[nextIndex].key);
  };

  return (
    <div className="flex items-start gap-px border-b border-subtle">
      <div role="tablist" aria-label={ariaLabel} className="flex min-w-0 flex-1 flex-wrap items-center gap-px">
        {tabs.map((tab, index) => {
          const isActive = tab.key === activeTab;
          return (
            <div key={tab.key} className="flex flex-col items-center gap-1.5">
              <button
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={getActivityTabId(idPrefix, tab.key)}
                aria-selected={isActive}
                aria-controls={getActivityTabPanelId(idPrefix)}
                tabIndex={isActive ? 0 : -1}
                className={cn(
                  "h-7 rounded-md px-2 py-0.5 text-body-sm-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-layer-transparent-active text-primary"
                    : "text-tertiary hover:bg-layer-transparent-hover"
                )}
                onClick={() => onTabChange(tab.key)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                {tab.label}
              </button>
              <div
                aria-hidden
                className={cn(
                  "h-0.5 w-full rounded-t-sm",
                  isActive ? "bg-(--text-color-icon-primary)" : "bg-transparent"
                )}
              />
            </div>
          );
        })}
      </div>
      {actionsElement && <div className="flex shrink-0 items-center justify-end gap-2">{actionsElement}</div>}
    </div>
  );
}
