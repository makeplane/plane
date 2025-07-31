"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { Earth, Info, Lock, Minus } from "lucide-react";
// components
import { PageActions } from "@/components/pages";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember } from "@/hooks/store";
import { usePageOperations } from "@/hooks/use-page-operations";
// plane web hooks
import { EPageStoreType } from "@/plane-web/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
  parentRef: React.RefObject<HTMLElement>;
  storeType: EPageStoreType;
};

export const BlockItemAction: FC<Props> = observer((props) => {
  const { page, parentRef, storeType } = props;
  // store hooks
  const { getUserDetails } = useMember();
  // page operations
  const { pageOperations } = usePageOperations({
    page,
  });
  // derived values
  const { access, created_at, is_favorite, owned_by, canCurrentUserFavoritePage } = page;
  const ownerDetails = owned_by ? getUserDetails(owned_by) : undefined;

  return (
    <>
      {/* page details */}
      <div className="cursor-default">{/* Avatar would be implemented here */}</div>
      <div className="cursor-default text-custom-text-300">{/* Access icon would be implemented here */}</div>
      {/* vertical divider */}
      <Minus className="h-5 w-5 text-custom-text-400 rotate-90 -mx-3" strokeWidth={1} />

      {/* page info */}
      <div className="h-4 w-4 grid place-items-center cursor-default">
        <Info className="h-4 w-4 text-custom-text-300" />
      </div>

      {/* favorite/unfavorite */}
      {canCurrentUserFavoritePage && (
        <button
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            pageOperations.toggleFavorite();
          }}
          className="text-custom-text-400 hover:text-custom-text-100"
        >
          {is_favorite ? "★" : "☆"}
        </button>
      )}

      {/* quick actions dropdown */}
      <PageActions
        optionsOrder={[
          "open-in-new-tab",
          "copy-link",
          "add-to-folder",
          "make-a-copy",
          "toggle-lock",
          "toggle-access",
          "archive-restore",
          "delete",
        ]}
        page={page}
        parentRef={parentRef}
        storeType={storeType}
      />
    </>
  );
});
