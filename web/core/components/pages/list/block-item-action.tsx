"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { Earth, Info, Lock, Minus } from "lucide-react";
// ui
import { Avatar, FavoriteStar, Tooltip } from "@plane/ui";
// components
import { PageActions } from "@/components/pages";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember, usePage } from "@/hooks/store";
import { usePageOperations } from "@/hooks/use-page-operations";

type Props = {
  pageId: string;
  parentRef: React.RefObject<HTMLElement>;
};

export const BlockItemAction: FC<Props> = observer((props) => {
  const { pageId, parentRef } = props;
  // store hooks
  const page = usePage(pageId);
  const { getUserDetails } = useMember();
  // page operations
  const { pageOperations } = usePageOperations(page);
  // derived values
  const { access, created_at, is_favorite, owned_by, canCurrentUserFavoritePage } = page;
  const ownerDetails = owned_by ? getUserDetails(owned_by) : undefined;

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
      {canCurrentUserFavoritePage && (
        <FavoriteStar
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            pageOperations.toggleFavorite();
          }}
          selected={is_favorite}
        />
      )}

      {/* quick actions dropdown */}
      <PageActions
        optionsOrder={[
          "toggle-lock",
          "toggle-access",
          "open-in-new-tab",
          "copy-link",
          "make-a-copy",
          "archive-restore",
          "delete",
        ]}
        page={page}
        parentRef={parentRef}
      />
    </>
  );
});
