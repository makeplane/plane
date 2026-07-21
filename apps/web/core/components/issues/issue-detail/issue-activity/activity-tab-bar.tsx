/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

export type TActivityTab = "all" | "activity" | "comments" | "worklogs" | "custom_fields";

const TAB_LABEL_KEYS: Record<TActivityTab, string> = {
  all: "common.all",
  activity: "common.activity",
  comments: "common.comments",
  worklogs: "common.worklogs",
  custom_fields: "common.custom_fields",
};

type TActivityTabBar = {
  activeTab: TActivityTab;
  setActiveTab: (tab: TActivityTab) => void;
  tabs?: TActivityTab[];
};

export const ActivityTabBar = observer(function ActivityTabBar(props: TActivityTabBar) {
  const { activeTab, setActiveTab, tabs = ["all", "activity", "comments", "worklogs"] } = props;
  const { t } = useTranslation();

  return (
    // the tab strip scrolls on its own once it outgrows the header, so the actions
    // next to it stay reachable without scrolling the page
    <div className="horizontal-scrollbar flex scrollbar-xs min-w-0 items-center gap-1 border-b border-subtle">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setActiveTab(tab)}
          className={cn(
            "relative shrink-0 px-3 py-2 text-body-sm-medium whitespace-nowrap transition-colors outline-none",
            activeTab === tab ? "text-primary" : "text-tertiary hover:text-secondary"
          )}
        >
          {t(TAB_LABEL_KEYS[tab])}
          {/* sits at bottom-0 rather than -bottom-px so it can't overflow the scroll container */}
          {activeTab === tab && (
            <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent-primary" aria-hidden />
          )}
        </button>
      ))}
    </div>
  );
});
