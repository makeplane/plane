"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { Earth, Info, Lock, Minus } from "lucide-react";
// ui
import { Avatar, FavoriteStar, TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// helpers
import { getFileURL, renderFormattedDate } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store";
// plane web components
import { WorkspacePageQuickActions } from "@/plane-web/components/pages";
// plane web hooks
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  workspaceSlug: string;
  page: TPageInstance;
  parentRef: React.RefObject<HTMLElement>;
};

export const PageListBlockItemAction: FC<Props> = observer((props) => {
  const { workspaceSlug, page, parentRef } = props;
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const { access, created_at, is_favorite, owned_by, addToFavorites, removePageFromFavorites } = page;
  const ownerDetails = owned_by ? getUserDetails(owned_by) : undefined;

  // handlers
  const handleFavorites = () => {
    if (is_favorite)
      removePageFromFavorites?.().then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Page removed from favorites.",
        })
      );
    else
      addToFavorites?.().then(() =>
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
      <div className="cursor-default">
        <Tooltip tooltipHeading="Owned by" tooltipContent={ownerDetails?.display_name}>
          <Avatar src={getFileURL(ownerDetails?.avatar_url ?? "")} name={ownerDetails?.display_name} />
        </Tooltip>
      </div>
      <div className="cursor-default text-custom-text-300">
        <Tooltip tooltipContent={access === 0 ? "Public" : "Private"}>
          {access === 0 ? <Earth className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </Tooltip>
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
        selected={!!is_favorite}
      />

      {/* quick actions dropdown */}
      <WorkspacePageQuickActions parentRef={parentRef} page={page} pageLink={`${workspaceSlug}/pages/${page.id}`} />
    </>
  );
});
