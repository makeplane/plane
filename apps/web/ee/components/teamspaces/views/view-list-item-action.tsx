import React, { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Earth, Lock } from "lucide-react";
// plane imports
import {
  EUserPermissionsLevel,
  TEAMSPACE_VIEW_TRACKER_ELEMENTS,
  TEAMSPACE_VIEW_TRACKER_EVENTS,
} from "@plane/constants";
import { EUserWorkspaceRoles, EViewAccess, TTeamspaceView } from "@plane/types";
import { Tooltip, FavoriteStar } from "@plane/ui";
// components
import { calculateTotalFilters } from "@plane/utils";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// helpers
// hooks
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useMember } from "@/hooks/store/use-member"
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
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

    addViewToFavorites(workspaceSlug.toString(), teamspaceId.toString(), view.id)
      .then(() => {
        captureSuccess({
          eventName: TEAMSPACE_VIEW_TRACKER_EVENTS.VIEW_FAVORITE,
          payload: { id: view?.id },
        });
      })
      .catch((err) => {
        captureError({
          eventName: TEAMSPACE_VIEW_TRACKER_EVENTS.VIEW_FAVORITE,
          error: err,
          payload: { id: view?.id },
        });
      });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !teamspaceId || !isFavoriteOperationAllowed) return;

    removeViewFromFavorites(workspaceSlug.toString(), teamspaceId.toString(), view.id)
      .then(() => {
        captureSuccess({
          eventName: TEAMSPACE_VIEW_TRACKER_EVENTS.VIEW_UNFAVORITE,
          payload: { id: view?.id },
        });
      })
      .catch((err) => {
        captureError({
          eventName: TEAMSPACE_VIEW_TRACKER_EVENTS.VIEW_UNFAVORITE,
          error: err,
          payload: { id: view?.id },
        });
      });
  };

  const ownedByDetails = view.owned_by ? getUserDetails(view.owned_by) : undefined;

  return (
    <>
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
            captureClick({
              elementName: TEAMSPACE_VIEW_TRACKER_ELEMENTS.LIST_ITEM_FAVORITE_BUTTON,
            });
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
