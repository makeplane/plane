import React, { FC } from "react";
import { observer } from "mobx-react";
import { Circle, Earth, Info, Lock, Minus } from "lucide-react";
// ui
import { Avatar, TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// components
import { FavoriteStar } from "@/components/core";
import { PageQuickActions } from "@/components/pages/dropdowns";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useMember, usePage } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  pageId: string;
};

export const BlockItemAction: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, pageId } = props;

  // store hooks
  const { access, created_at, is_favorite, owned_by, addToFavorites, removeFromFavorites } = usePage(pageId);
  const { getUserDetails } = useMember();

  // derived values
  const ownerDetails = owned_by ? getUserDetails(owned_by) : undefined;

  // handlers
  const handleFavorites = () => {
    if (is_favorite)
      removeFromFavorites().then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Page removed from favorites.",
        })
      );
    else
      addToFavorites().then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Page added to favorites.",
        })
      );
  };
  return (
    <>
      {/* page details */}
      <div className="flex items-center gap-2 text-custom-text-400">
        {/* <span className="text-xs">Labels</span>
           <Circle className="h-1 w-1 fill-custom-text-300" /> */}
        <div className="cursor-default">
          <Tooltip tooltipHeading="Owned by" tooltipContent={ownerDetails?.display_name}>
            <Avatar src={ownerDetails?.avatar} name={ownerDetails?.display_name} />
          </Tooltip>
        </div>
        <Circle className="h-1 w-1 fill-custom-text-300" />
        {/* <span className="text-xs cursor-default">10m read</span>
           <Circle className="h-1 w-1 fill-custom-text-300" /> */}
        <div className="cursor-default">
          <Tooltip tooltipContent={access === 0 ? "Public" : "Private"}>
            {access === 0 ? <Earth className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          </Tooltip>
        </div>
      </div>

      {/* vertical divider */}
      <Minus className="h-5 w-5 text-custom-text-400 rotate-90 -mx-3" strokeWidth={1} />

      {/* page info */}
      <Tooltip tooltipContent={`Created on ${renderFormattedDate(created_at)}`}>
        <span className="h-4 w-4 grid place-items-center cursor-default">
          <Info className="h-4 w-4 text-custom-text-300" />
        </span>
      </Tooltip>

      {/* favorite/unfavorite */}
      <FavoriteStar
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleFavorites();
        }}
        selected={is_favorite}
      />

      {/* quick actions dropdown */}
      <PageQuickActions pageId={pageId} projectId={projectId} workspaceSlug={workspaceSlug} />
    </>
  );
});
