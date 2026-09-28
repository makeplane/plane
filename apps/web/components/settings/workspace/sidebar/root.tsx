/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { ScrollArea } from "@makeplane/propel/components/scroll-area";
import { cn } from "@plane/utils";
// local imports
import { WorkspaceSettingsSidebarHeader } from "./header";
import { WorkspaceSettingsSidebarItemCategories } from "./item-categories";

type Props = {
  className?: string;
};

export function WorkspaceSettingsSidebarRoot(props: Props) {
  const { className } = props;

  return (
    <div
      className={cn(
        "flex h-full w-[250px] shrink-0 animate-fade-in flex-col overflow-hidden border-r border-r-subtle bg-surface-1",
        className
      )}
    >
      <ScrollArea orientation="vertical">
        <WorkspaceSettingsSidebarHeader />
        <WorkspaceSettingsSidebarItemCategories />
      </ScrollArea>
    </div>
  );
}
