"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Settings } from "lucide-react";
// ui
import { Breadcrumbs } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useWorkspace } from "@/hooks/store";

export const WorkspaceSettingHeader: FC = observer(() => {
  const { currentWorkspace, loader } = useWorkspace();

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <Breadcrumbs isLoading={loader}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${currentWorkspace?.slug}/settings`}
                  label={currentWorkspace?.name ?? "Workspace"}
                  icon={<Settings className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink label="Settings" />} />
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
});
