"use client";

import { FC } from "react";
import { EUserPermissions, EUserPermissionsLevel } from "ee/constants/user-permissions";
import { observer } from "mobx-react";
// ui
import { PenSquare, Plus } from "lucide-react";
import { Breadcrumbs, Button } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUserPermissions } from "@/hooks/store";

export const DraftsBaseHeader: FC = observer(() => {
  // store hooks
  const { loader } = useProject();
    const { toggleCreateProjectModal } = useCommandPalette();
    const { setTrackElement } = useEventTracker();

  const { allowPermissions } = useUserPermissions();

  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <Breadcrumbs isLoading={loader}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink label="Drafts" icon={ <PenSquare className="h-4 w-4" />} />
              }
            />
          </Breadcrumbs>
        </div>

        <div className="ml-auto flex items-center">
        {isAuthorizedUser ? (
          <Button
            size="sm"
            prependIcon={<Plus />}
            onClick={() => {
              setTrackElement("Projects page");
              toggleCreateProjectModal(true);
            }}
            className="items-center gap-1"
          >
            Draft <span className="hidden sm:inline-block">issue</span>
          </Button>
        ) : (
          <></>
        )}
        </div>
      </div>
    </div>
  );
});