/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { ScrollArea } from "@makeplane/propel/components/scroll-area";
// local imports
import { ProjectSettingsSidebarHeader } from "./header";
import { ProjectSettingsSidebarItemCategories } from "./item-categories";

type Props = {
  projectId: string;
};

export function ProjectSettingsSidebarRoot(props: Props) {
  const { projectId } = props;

  return (
    <div className="flex h-full min-h-0 w-[250px] shrink-0 animate-fade-in flex-col overflow-hidden border-r border-r-subtle bg-surface-1">
      <ProjectSettingsSidebarHeader projectId={projectId} />
      <ScrollArea orientation="vertical" size="sm">
        <div className="pb-5">
          <ProjectSettingsSidebarItemCategories projectId={projectId} />
        </div>
      </ScrollArea>
    </div>
  );
}
