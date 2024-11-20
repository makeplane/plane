"use client";

import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Earth, Info, Lock, Minus } from "lucide-react";
// ui
import { Avatar, FavoriteStar, TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// components
import { PageActions, TPageConfig, TPageOperations } from "@/components/pages";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useMember, usePage } from "@/hooks/store";

type Props = {
  pageId: string;
  parentRef: React.RefObject<HTMLElement>;
};

export const BlockItemAction: FC<Props> = observer((props) => {
  const { pageId, parentRef } = props;
  // params
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const page = usePage(pageId);
  const { getUserDetails } = useMember();
  // derived values
  const {
    access,
    addToFavorites,
    archive,
    archived_at,
    canCurrentUserChangeAccess,
    canCurrentUserArchivePage,
    canCurrentUserDeletePage,
    canCurrentUserDuplicatePage,
    canCurrentUserFavoritePage,
    canCurrentUserLockPage,
    canCurrentUserMovePage,
    created_at,
    duplicate,
    id,
    is_favorite,
    is_locked,
    lock,
    makePrivate,
    makePublic,
    owned_by,
    removePageFromFavorites,
    restore,
    unlock,
  } = page;
  const ownerDetails = owned_by ? getUserDetails(owned_by) : undefined;

  const pageOperations: TPageOperations = useMemo(() => {
    const pageLink = projectId ? `${workspaceSlug}/projects/${projectId}/pages/${id}` : `${workspaceSlug}/pages/${id}`;

    return {
      copyLink: () => {
        copyUrlToClipboard(pageLink).then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Link Copied!",
            message: "Page link copied to clipboard.",
          });
        });
      },
      duplicate: async () => {
        try {
          await duplicate();
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Page duplicated successfully.",
          });
        } catch {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Page could not be duplicated. Please try again later.",
          });
        }
      },
      move: async () => {},
      openInNewTab: () => window.open(`/${pageLink}`, "_blank"),
      toggleAccess: async () => {
        const changedPageType = access === 0 ? "private" : "public";
        try {
          if (access === 0) await makePrivate();
          else await makePublic();

          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `The page has been marked ${changedPageType} and moved to the ${changedPageType} section.`,
          });
        } catch {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: `The page couldn't be marked ${changedPageType}. Please try again.`,
          });
        }
      },
      toggleArchive: async () => {
        if (archived_at) {
          try {
            await restore();
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page restored successfully.",
            });
          } catch {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be restored. Please try again later.",
            });
          }
        } else {
          try {
            await archive();
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page archived successfully.",
            });
          } catch {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be archived. Please try again later.",
            });
          }
        }
      },
      toggleLock: async () => {
        if (is_locked) {
          try {
            await unlock();
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page unlocked successfully.",
            });
          } catch {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be unlocked. Please try again later.",
            });
          }
        } else {
          try {
            await lock();
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page locked successfully.",
            });
          } catch {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be locked. Please try again later.",
            });
          }
        }
      },
    };
  }, [
    access,
    archive,
    archived_at,
    duplicate,
    id,
    is_locked,
    lock,
    makePrivate,
    makePublic,
    projectId,
    restore,
    unlock,
    workspaceSlug,
  ]);
  const pageConfig: TPageConfig = useMemo(
    () => ({
      canArchive: canCurrentUserArchivePage,
      canLock: canCurrentUserLockPage,
      canMove: canCurrentUserMovePage,
      canToggleAccess: canCurrentUserChangeAccess && !archived_at,
      canDelete: canCurrentUserDeletePage && !!archived_at,
      canDuplicate: canCurrentUserDuplicatePage,
      isArchived: !!archived_at,
      isLocked: is_locked,
      pageAccess: access ?? 0,
    }),
    [
      access,
      archived_at,
      canCurrentUserMovePage,
      canCurrentUserArchivePage,
      canCurrentUserChangeAccess,
      canCurrentUserDeletePage,
      canCurrentUserDuplicatePage,
      canCurrentUserLockPage,
      is_locked,
    ]
  );
  // handlers
  const handleFavorites = () => {
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
            handleFavorites();
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
        pageConfig={pageConfig}
        pageId={pageId}
        pageOperations={pageOperations}
        parentRef={parentRef}
      />
    </>
  );
});
