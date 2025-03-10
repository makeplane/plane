import { useCallback } from "react";
import { observer } from "mobx-react";
import { Info, Minus } from "lucide-react";
// plane ui
import { Avatar, FavoriteStar, setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
// plane utils
import { getFileURL, renderFormattedDate } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store";
// plane web store
import { IDashboardInstance } from "@/plane-web/store/dashboards/dashboard";
import { DashboardQuickActions } from "../quick-actions";

type Props = {
  dashboard: IDashboardInstance;
  parentRef: React.RefObject<HTMLElement>;
};

export const DashboardListItemActions: React.FC<Props> = observer((props) => {
  const { dashboard, parentRef } = props;
  // derived values
  const { getUserDetails } = useMember();
  // derived values
  const {
    created_at,
    created_by,
    id,
    is_favorite,
    canCurrentUserFavoriteDashboard,
    addToFavorites,
    removeFromFavorites,
  } = dashboard;
  const creatorDetails = getUserDetails(created_by ?? "");

  const handleToggleFavorite = useCallback(async () => {
    try {
      if (is_favorite) {
        await removeFromFavorites();
      } else {
        await addToFavorites();
      }
    } catch (error) {
      console.error("Error while toggling favorite", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: is_favorite
          ? "Dashboard could not be removed from favorites. Please try again."
          : "Dashboard could not be added to favorites. Please try again.",
      });
    }
  }, [addToFavorites, is_favorite, removeFromFavorites]);

  return (
    <>
      {/* creator details */}
      <div className="cursor-default">
        <Tooltip tooltipHeading="Created by" tooltipContent={creatorDetails?.display_name}>
          <Avatar src={getFileURL(creatorDetails?.avatar_url ?? "")} name={creatorDetails?.display_name} />
        </Tooltip>
      </div>
      {/* <div className="cursor-default text-custom-text-300">
        <Tooltip tooltipContent={access === 0 ? "Public" : "Private"}>
          {access === 0 ? <Earth className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </Tooltip>
      </div> */}
      {/* dashboard info */}
      <Tooltip tooltipContent={`Created on ${renderFormattedDate(created_at)}`}>
        <span className="size-4 grid place-items-center cursor-default">
          <Info className="size-4 text-custom-text-300" />
        </span>
      </Tooltip>
      {/* vertical divider */}
      <Minus className="size-5 text-custom-text-400 rotate-90 -mx-3" strokeWidth={1} />

      {/* favorite/unfavorite */}
      {canCurrentUserFavoriteDashboard && (
        <FavoriteStar
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToggleFavorite();
          }}
          selected={!!is_favorite}
        />
      )}
      {id && <DashboardQuickActions dashboardId={id} parentRef={parentRef} />}
    </>
  );
});
