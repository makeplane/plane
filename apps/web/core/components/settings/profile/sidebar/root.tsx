/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { ScrollArea } from "@makeplane/propel/components/scroll-area";
import type { TProfileSettingsTabs } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { ProfileSettingsSidebarHeader } from "./header";
import { ProfileSettingsSidebarItemCategories } from "./item-categories";

type Props = {
  activeTab: TProfileSettingsTabs;
  className?: string;
  updateActiveTab: (tab: TProfileSettingsTabs) => void;
};

export function ProfileSettingsSidebarRoot(props: Props) {
  const { activeTab, className, updateActiveTab } = props;

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col overflow-hidden border-r border-r-subtle bg-surface-2 px-3 py-4",
        className
      )}
    >
      <ScrollArea orientation="vertical">
        <ProfileSettingsSidebarHeader />
        <ProfileSettingsSidebarItemCategories activeTab={activeTab} updateActiveTab={updateActiveTab} />
      </ScrollArea>
    </div>
  );
}
