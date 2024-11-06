"use client";

import { observer } from "mobx-react";
// editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
// ui
import { ArchiveIcon, FavoriteStar, setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
// components
import { LockedComponent } from "@/components/icons/locked-component";
import { PageInfoPopover, PageOptionsDropdown } from "@/components/pages";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import useOnlineStatus from "@/hooks/use-online-status";
// store
import { IPage } from "@/store/pages/page";

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  handleDuplicatePage: () => void;
  page: IPage;
  readOnlyEditorRef: React.RefObject<EditorReadOnlyRefApi>;
};

export const PageExtraOptions: React.FC<Props> = observer((props) => {
  const { editorRef, handleDuplicatePage, page, readOnlyEditorRef } = props;
  // derived values
  const {
    archived_at,
    isContentEditable,
    is_favorite,
    is_locked,
    canCurrentUserFavoritePage,
    addToFavorites,
    removePageFromFavorites,
  } = page;
  // use online status
  const { isOnline } = useOnlineStatus();
  // favorite handler
  const handleFavorite = () => {
    if (is_favorite) {
      removePageFromFavorites().then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Page removed from favorites.",
        })
      );
    } else {
      addToFavorites().then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Page added to favorites.",
        })
      );
    }
  };

  return (
    <div className="flex items-center justify-end gap-3">
      {is_locked && <LockedComponent />}
      {archived_at && (
        <div className="flex-shrink-0 flex h-7 items-center gap-2 rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-medium text-blue-500">
          <ArchiveIcon className="flex-shrink-0 size-3" />
          <span>Archived at {renderFormattedDate(archived_at)}</span>
        </div>
      )}
      {isContentEditable && !isOnline && (
        <Tooltip
          tooltipHeading="You are offline."
          tooltipContent="You can continue making changes. They will be synced when you are back online."
        >
          <div className="flex-shrink-0 flex h-7 items-center gap-2 rounded-full bg-custom-background-80 px-3 py-0.5 text-xs font-medium text-custom-text-300">
            <span className="flex-shrink-0 size-1.5 rounded-full bg-custom-text-300" />
            <span>Offline</span>
          </div>
        </Tooltip>
      )}
      {canCurrentUserFavoritePage && (
        <FavoriteStar
          selected={is_favorite}
          onClick={handleFavorite}
          buttonClassName="flex-shrink-0"
          iconClassName="text-custom-text-100"
        />
      )}
      <PageInfoPopover editorRef={isContentEditable ? editorRef.current : readOnlyEditorRef.current} />
      <PageOptionsDropdown
        editorRef={isContentEditable ? editorRef.current : readOnlyEditorRef.current}
        handleDuplicatePage={handleDuplicatePage}
        page={page}
      />
    </div>
  );
});
