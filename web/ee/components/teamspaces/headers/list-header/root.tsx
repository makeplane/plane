"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
import { Breadcrumbs, Button, TeamsIcon } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useWorkspace, useCommandPalette, useEventTracker, useUserPermissions } from "@/hooks/store";
// plane web components
import { TeamspacesListSearch } from "@/plane-web/components/teamspaces/headers/list-header";

export const TeamspaceListItemHeader = observer(() => {
  const { workspaceSlug } = useParams();
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { setTrackElement } = useEventTracker();
  const { toggleCreateTeamspaceModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const workspaceId = currentWorkspace?.id || undefined;
  const hasAdminLevelPermissions = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (!workspaceSlug || !workspaceId) return <></>;

  return (
    <div className="flex-shrink-0 relative z-10 flex h-[3.75rem] w-full">
      <div className="w-full h-full relative flex justify-between items-center gap-x-2 gap-y-4">
        <div className="flex items-center gap-4">
          {/* bread crumps */}
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink label="Teamspaces" icon={<TeamsIcon className="h-4 w-4 text-custom-text-300" />} />
              }
            />
          </Breadcrumbs>
          {/* Only workspace admins can see and join teamspaces created by other admins. */}
          {/* {hasAdminLevelPermissions && <TeamspaceScopeDropdown />} */}
        </div>
        <div className="flex items-center gap-4">
          {/* search */}
          <TeamspacesListSearch />
          {/* filters dropdown */}
          {/* <div className="flex items-center gap-4">
            <TeamListFiltersDropdown />
          </div> */}
          {/* create teamspace button */}
          {hasAdminLevelPermissions && (
            <Button
              size="sm"
              onClick={() => {
                setTrackElement("Teamspaces page");
                toggleCreateTeamspaceModal({ isOpen: true, teamspaceId: undefined });
              }}
              className="items-center gap-1"
            >
              <Plus className="h-3 w-3 sm:mr-1" aria-hidden="true" />
              <span className="hidden sm:inline-block">New</span> Teamspace
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
