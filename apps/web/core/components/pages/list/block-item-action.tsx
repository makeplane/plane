import { observer } from "mobx-react";
import { Earth, Info, Minus } from "lucide-react";
// plane imports
import { LockIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { Avatar, FavoriteStar } from "@plane/ui";
import { renderFormattedDate, getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePageOperations } from "@/hooks/use-page-operations";
// plane web hooks
import type { EPageStoreType } from "@/plane-web/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageActions } from "../dropdowns";

type Props = {
  page: TPageInstance;
  parentRef: React.RefObject<HTMLElement>;
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
      {/* page details */}
      <div className="cursor-default">
        <Tooltip tooltipHeading="Owned by" tooltipContent={ownerDetails?.display_name}>
          <Avatar src={getFileURL(ownerDetails?.avatar_url ?? "")} name={ownerDetails?.display_name} />
        </Tooltip>
      </div>
      <div className="cursor-default text-tertiary">
        <Tooltip tooltipContent={access === 0 ? "Public" : "Private"}>
          {access === 0 ? <Earth className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
        </Tooltip>
      </div>
      {/* vertical divider */}
      <Minus className="h-5 w-5 text-placeholder rotate-90 -mx-3" strokeWidth={1} />

      {/* page info */}
      <Tooltip tooltipContent={`Created on ${renderFormattedDate(created_at)}`}>
        <span className="h-4 w-4 grid place-items-center cursor-default">
          <Info className="h-4 w-4 text-tertiary" />
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
