"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Breadcrumbs, Button, TeamsIcon } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useWorkspace, useCommandPalette, useEventTracker, useUserPermissions } from "@/hooks/store";
// plane web components
import { TeamListSearch } from "@/plane-web/components/teams/headers/list-header";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

export const TeamsListHeader = observer(() => {
  const { workspaceSlug } = useParams();
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { setTrackElement } = useEventTracker();
  const { toggleCreateTeamModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const workspaceId = currentWorkspace?.id || undefined;
  const isAuthorizedUser = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (!workspaceSlug || !workspaceId) return <></>;

  return (
    <div className="flex-shrink-0 relative z-10 flex h-[3.75rem] w-full">
      <div className="w-full h-full relative flex justify-between items-center gap-x-2 gap-y-4">
        <div className="flex items-center gap-4">
          {/* bread crumps */}
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Teams" icon={<TeamsIcon className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
        <div className="flex items-center gap-4">
          {/* search */}
          <TeamListSearch />
          {/* filters dropdown */}
          {/* <div className="flex items-center gap-4">
            <TeamListFiltersDropdown />
          </div> */}
          {/* create team button */}
          {isAuthorizedUser && (
            <Button
              size="sm"
              onClick={() => {
                setTrackElement("Teams page");
                toggleCreateTeamModal({ isOpen: true, teamId: undefined });
              }}
              className="items-center gap-1"
            >
              <span className="hidden sm:inline-block">Add</span> Team
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
