/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { GlobeOutline, InfoOutline, LockOutline } from "@makeplane/propel/icons";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { Icon } from "@makeplane/propel/components/icon";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { FavoriteStar } from "@plane/blocks/common";
import { renderFormattedDate, getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePageOperations } from "@/hooks/use-page-operations";
// plane web hooks
import type { EPageStoreType } from "@/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageActions } from "../dropdowns";

type Props = {
  page: TPageInstance;
  parentRef: React.RefObject<HTMLElement | null>;
  storeType: EPageStoreType;
};

export const BlockItemAction = observer(function BlockItemAction(props: Props) {
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
      {/* page access */}
      <div className="grid size-(--control-height-sm) cursor-default place-items-center text-icon-secondary [--node-size:var(--control-glyph-sm)]">
        <Tooltip label={access === 0 ? "Public" : "Private"}>
          <Icon icon={access === 0 ? GlobeOutline : LockOutline} />
        </Tooltip>
      </div>
      {/* page details */}
      <div className="grid size-6 cursor-default place-items-center">
        <Tooltip label={`Owned by: ${ownerDetails?.display_name ?? ""}`} layout="stacked">
          <Avatar
            alt={ownerDetails?.display_name}
            fallback={ownerDetails?.display_name?.[0]?.toUpperCase()}
            src={getFileURL(ownerDetails?.avatar_url ?? "")}
            size="2xs"
          />
        </Tooltip>
      </div>
      {/* page info */}
      <div className="grid size-(--control-height-sm) cursor-default place-items-center text-icon-secondary [--node-size:var(--control-glyph-sm)]">
        <Tooltip label={`Created on ${renderFormattedDate(created_at)}`} layout="stacked">
          <Icon icon={InfoOutline} />
        </Tooltip>
      </div>

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
          "open-in-new-tab",
          "copy-link",
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
