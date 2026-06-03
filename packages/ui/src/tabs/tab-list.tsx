/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Tab } from "@headlessui/react";
import type { LucideProps } from "lucide-react";
import type { FC } from "react";
import React from "react";
// helpers
import { cn } from "../utils";

export type TabListItem = {
  key: string;
  icon?: FC<LucideProps>;
  label?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
};

type TTabListProps = {
  tabs: TabListItem[];
  tabListClassName?: string;
  tabClassName?: string;
  size?: "sm" | "md" | "lg";
  selectedTab?: string;
  autoWrap?: boolean;
  onTabChange?: (key: string) => void;
};

export function TabList({ autoWrap = true, ...props }: TTabListProps) {
  return autoWrap ? (
    <Tab.Group>
      <TabListInner {...props} />
    </Tab.Group>
  ) : (
    <TabListInner {...props} />
  );
}

function TabListInner({ tabs, tabListClassName, tabClassName, size = "md", selectedTab, onTabChange }: TTabListProps) {
  return (
    <Tab.List
      as="div"
      className={cn(
        "flex w-full min-w-fit items-center justify-between gap-1.5 rounded-md bg-layer-1 p-0.5 text-13",
        tabListClassName
      )}
    >
      {tabs.map((tab) => (
        <Tab
          className={({ selected }) =>
            cn(
              "flex w-full min-w-fit cursor-pointer items-center justify-center rounded-sm p-1 font-medium text-primary transition-all outline-none focus:outline-none",
              (selectedTab ? selectedTab === tab.key : selected)
                ? "shadow-sm bg-layer-transparent-active text-primary"
                : tab.disabled
                  ? "cursor-not-allowed text-placeholder"
                  : "text-placeholder hover:bg-layer-transparent-hover hover:text-tertiary",
              {
                "text-11": size === "sm",
                "text-13": size === "md",
                "text-14": size === "lg",
              },
              tabClassName
            )
          }
          key={tab.key}
          onClick={() => {
            if (!tab.disabled) {
              onTabChange?.(tab.key);
              tab.onClick?.();
            }
          }}
          disabled={tab.disabled}
        >
          {tab.icon && (
            <tab.icon className={cn({ "size-3": size === "sm", "size-4": size === "md", "size-5": size === "lg" })} />
          )}
          {tab.label}
        </Tab>
      ))}
    </Tab.List>
  );
}
