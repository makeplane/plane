import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Earth, Lock } from "lucide-react";
// types
import { TTeamView } from "@plane/types";
// ui
import { Tooltip, FavoriteStar } from "@plane/ui";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { DeleteProjectViewModal } from "@/components/views";
// constants
import { EViewAccess } from "@/constants/views";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useMember, useUserPermissions } from "@/hooks/store";
// plane web components
import { CreateUpdateTeamViewModal } from "@/plane-web/components/teams/views/modals/create-update";
import { TeamViewQuickActions } from "@/plane-web/components/teams/views/quick-actions";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// plane web hooks
import { useTeamViews } from "@/plane-web/hooks/store";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  teamId: string;
  view: TTeamView;
};

export const TeamViewListItemAction: FC<Props> = observer((props) => {
  const { parentRef, teamId, view } = props;
  // states
  const [createUpdateViewModal, setCreateUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store
  const { allowPermissions } = useUserPermissions();
  const { addViewToFavorites, removeViewFromFavorites } = useTeamViews();
  const { getUserDetails } = useMember();
  // derived values
  const isEditingAllowed = view.is_team_view
    ? allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.WORKSPACE,
        workspaceSlug?.toString()
      )
    : allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        workspaceSlug?.toString(),
        view.project
      );
  const totalFilters = calculateTotalFilters(view.filters ?? {});
  const access = view.access;

  // handlers
  const handleAddToFavorites = () => {
    if (!workspaceSlug || !teamId || view.is_team_view) return;

    addViewToFavorites(workspaceSlug.toString(), teamId.toString(), view.id);
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !teamId || view.is_team_view) return;

    removeViewFromFavorites(workspaceSlug.toString(), teamId.toString(), view.id);
  };

  const ownedByDetails = view.owned_by ? getUserDetails(view.owned_by) : undefined;

  return (
    <>
      {workspaceSlug && teamId && view && (
        <CreateUpdateTeamViewModal
          isOpen={createUpdateViewModal}
          onClose={() => setCreateUpdateViewModal(false)}
          workspaceSlug={workspaceSlug.toString()}
          teamId={teamId.toString()}
          data={view}
        />
      )}
      <DeleteProjectViewModal data={view} isOpen={deleteViewModal} onClose={() => setDeleteViewModal(false)} />
      <p className="hidden rounded bg-custom-background-80 px-2 py-1 text-xs text-custom-text-200 group-hover:block">
        {totalFilters} {totalFilters === 1 ? "filter" : "filters"}
      </p>

      <div className="cursor-default text-custom-text-300">
        <Tooltip tooltipContent={access === EViewAccess.PUBLIC ? "Public" : "Private"}>
          {access === EViewAccess.PUBLIC ? <Earth className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </Tooltip>
      </div>

      {/* created by */}
      {<ButtonAvatars showTooltip={false} userIds={ownedByDetails?.id ?? []} />}

      {isEditingAllowed && !view.is_team_view && (
        <FavoriteStar
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (view.is_favorite) handleRemoveFromFavorites();
            else handleAddToFavorites();
          }}
          selected={view.is_favorite}
        />
      )}
      {view && workspaceSlug && (
        <div className="hidden md:block">
          <TeamViewQuickActions
            parentRef={parentRef}
            teamId={teamId}
            view={view}
            workspaceSlug={workspaceSlug.toString()}
          />
        </div>
      )}
    </>
  );
});
