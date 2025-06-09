import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Earth, Lock } from "lucide-react";
// plane imports
import { EViewAccess, EUserPermissionsLevel, EUserWorkspaceRoles } from "@plane/constants";
import { TTeamspaceView } from "@plane/types";
import { Tooltip, FavoriteStar } from "@plane/ui";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { DeleteProjectViewModal } from "@/components/views";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useMember, useUserPermissions } from "@/hooks/store";
// plane web components
import { CreateUpdateTeamspaceViewModal } from "@/plane-web/components/teamspaces/views/modals/create-update";
import { TeamspaceViewQuickActions } from "@/plane-web/components/teamspaces/views/quick-actions";
// plane web constants
// plane web hooks
import { useTeamspaceViews } from "@/plane-web/hooks/store";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  teamspaceId: string;
  view: TTeamspaceView;
};

export const TeamspaceViewListItemAction: FC<Props> = observer((props) => {
  const { parentRef, teamspaceId, view } = props;
  // states
  const [createUpdateViewModal, setCreateUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store
  const { allowPermissions } = useUserPermissions();
  const { addViewToFavorites, removeViewFromFavorites } = useTeamspaceViews();
  const { getUserDetails } = useMember();
  // derived values
  const isEditingAllowed = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );
  const totalFilters = calculateTotalFilters(view.filters ?? {});
  const access = view.access;
  const isFavoriteOperationAllowed = false; // TODO: Favorite operation is not supported for teamspace views right now

  // handlers
  const handleAddToFavorites = () => {
    if (!workspaceSlug || !teamspaceId || !isFavoriteOperationAllowed) return;

    addViewToFavorites(workspaceSlug.toString(), teamspaceId.toString(), view.id);
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !teamspaceId || !isFavoriteOperationAllowed) return;

    removeViewFromFavorites(workspaceSlug.toString(), teamspaceId.toString(), view.id);
  };

  const ownedByDetails = view.owned_by ? getUserDetails(view.owned_by) : undefined;

  return (
    <>
      {workspaceSlug && teamspaceId && view && (
        <CreateUpdateTeamspaceViewModal
          isOpen={createUpdateViewModal}
          onClose={() => setCreateUpdateViewModal(false)}
          workspaceSlug={workspaceSlug.toString()}
          teamspaceId={teamspaceId.toString()}
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

      {isEditingAllowed && isFavoriteOperationAllowed && (
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
          <TeamspaceViewQuickActions
            parentRef={parentRef}
            teamspaceId={teamspaceId}
            view={view}
            workspaceSlug={workspaceSlug.toString()}
          />
        </div>
      )}
    </>
  );
});
