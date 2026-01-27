/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { ScrollArea } from "@plane/propel/scrollarea";
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
    <ScrollArea
      scrollType="hover"
      orientation="vertical"
      size="sm"
      rootClassName={cn(
        "shrink-0 animate-fade-in h-full w-[250px] bg-surface-1 border-r border-r-subtle overflow-y-scroll",
        className
      )}
    >
      <WorkspaceSettingsSidebarHeader />
      <WorkspaceSettingsSidebarItemCategories />
    </ScrollArea>
  );
}
