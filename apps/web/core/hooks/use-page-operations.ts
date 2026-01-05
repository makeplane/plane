import { useMemo } from "react";
// plane imports
import { IS_FAVORITE_MENU_OPEN } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EPageAccess } from "@plane/types";
import { copyUrlToClipboard } from "@plane/utils";
// hooks
import { useCollaborativePageActions } from "@/hooks/use-collaborative-page-actions";
// store types
import type { TPageInstance } from "@/store/pages/base-page";
// local storage
import useLocalStorage from "./use-local-storage";

export type TPageOperations = {
  toggleLock: () => void;
  toggleAccess: () => void;
  toggleFavorite: () => void;
  openInNewTab: () => void;
  copyLink: () => void;
  duplicate: () => void;
  toggleArchive: () => void;
};

type Props = {
  page: TPageInstance;
};

export const usePageOperations = (
  props: Props
): {
  pageOperations: TPageOperations;
} => {
  const { page } = props;
  // derived values
  const {
    access,
    addToFavorites,
    archived_at,
    duplicate,
    is_favorite,
    is_locked,
    getRedirectionLink,
    removePageFromFavorites,
  } = page;
  // collaborative actions
  const { executeCollaborativeAction } = useCollaborativePageActions(props);
  // local storage
  const { setValue: toggleFavoriteMenu, storedValue: isFavoriteMenuOpen } = useLocalStorage<boolean>(
    IS_FAVORITE_MENU_OPEN,
    false
  );
  // page operations
  const pageOperations: TPageOperations = useMemo(() => {
    const pageLink = getRedirectionLink();

    return {
      copyLink: async () => {
        await copyUrlToClipboard(pageLink);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Link Copied!",
          message: "Page link copied to clipboard.",
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
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Page could not be duplicated. Please try again later.",
          });
        }
      },
      move: async () => {},
      openInNewTab: () => window.open(pageLink, "_blank"),
      toggleAccess: async () => {
        const changedPageType = access === EPageAccess.PUBLIC ? "private" : "public";
        try {
          if (access === EPageAccess.PUBLIC)
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "make-private" });
          else await executeCollaborativeAction({ type: "sendMessageToServer", message: "make-public" });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `The page has been marked ${changedPageType} and moved to the ${changedPageType} section.`,
          });
        } catch (_error) {
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
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "unarchive" });
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page restored successfully.",
            });
          } catch (_error) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be restored. Please try again later.",
            });
          }
        } else {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "archive" });
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page archived successfully.",
            });
          } catch (_error) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be archived. Please try again later.",
            });
          }
        }
      },
      toggleFavorite: async () => {
        if (is_favorite) {
          try {
            await removePageFromFavorites();
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page removed from favorites.",
            });
          } catch (_error) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be removed from favorites. Please try again later.",
            });
          }
        } else {
          try {
            await addToFavorites();
            if (!isFavoriteMenuOpen) toggleFavoriteMenu(true);
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page added to favorites.",
            });
          } catch (_error) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be added to favorites. Please try again later.",
            });
          }
        }
      },
      toggleLock: async () => {
        if (is_locked) {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "unlock" });
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page unlocked successfully.",
            });
          } catch (_error) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be unlocked. Please try again later.",
            });
          }
        } else {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "lock" });
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page locked successfully.",
            });
          } catch (_error) {
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
    archived_at,
    duplicate,
    executeCollaborativeAction,
    getRedirectionLink,
    is_favorite,
    is_locked,
    isFavoriteMenuOpen,
    removePageFromFavorites,
    toggleFavoriteMenu,
  ]);
  return {
    pageOperations,
  };
};
