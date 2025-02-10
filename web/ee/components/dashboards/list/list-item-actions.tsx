import { observer } from "mobx-react";
import { Info, Minus } from "lucide-react";
// plane ui
import { Avatar, FavoriteStar, Tooltip } from "@plane/ui";
// plane utils
import { getFileURL, renderFormattedDate } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store";
// plane web store
import { IWorkspaceDashboardInstance } from "@/plane-web/store/dashboards/dashboard";

type Props = {
  dashboardDetails: IWorkspaceDashboardInstance;
};

export const WorkspaceDashboardListItemActions: React.FC<Props> = observer((props) => {
  const { dashboardDetails } = props;
  // derived values
  const { getUserDetails } = useMember();
  // derived values
  const { created_at, created_by, is_favorite, canCurrentUserFavoriteDashboard } = dashboardDetails;
  const creatorDetails = getUserDetails(created_by ?? "");

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
            // pageOperations.toggleFavorite();
          }}
          selected={!!is_favorite}
        />
      )}
    </>
  );
});
