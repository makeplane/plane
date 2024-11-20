import { useMemo } from "react";
import { useParams } from "next/navigation";
// plane ui
import { setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { copyUrlToClipboard } from "@/helpers/string.helper";
// store types
import { IPage } from "@/store/pages/page";

export type TPageOperations = {
  toggleLock: () => void;
  toggleAccess: () => void;
  toggleFavorite: () => void;
  openInNewTab: () => void;
  copyLink: () => void;
  duplicate: () => void;
  toggleArchive: () => void;
};

export const usePageOperations = (
  page: IPage
): {
  pageOperations: TPageOperations;
} => {
  // params
  const { workspaceSlug, projectId } = useParams(); // derived values
  const {
    access,
    addToFavorites,
    archive,
    archived_at,
    duplicate,
    id,
    is_favorite,
    is_locked,
    lock,
    makePrivate,
    makePublic,
    removePageFromFavorites,
    restore,
    unlock,
  } = page;
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
      toggleFavorite: () => {
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
    addToFavorites,
    archive,
    archived_at,
    duplicate,
    id,
    is_favorite,
    is_locked,
    lock,
    makePrivate,
    makePublic,
    projectId,
    removePageFromFavorites,
    restore,
    unlock,
    workspaceSlug,
  ]);
  return {
    pageOperations,
  };
};
