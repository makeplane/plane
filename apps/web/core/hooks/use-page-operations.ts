import { useMemo } from "react";
// plane imports
import { IS_FAVORITE_MENU_OPEN, PROJECT_PAGE_TRACKER_EVENTS } from "@plane/constants";
import { EditorRefApi } from "@plane/editor";
import { EPageAccess } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { copyUrlToClipboard } from "@plane/utils";
// helpers
import { captureSuccess, captureError } from "@/helpers/event-tracker.helper";
// hooks
import { useCollaborativePageActions } from "@/hooks/use-collaborative-page-actions";
// store types
import { TPageInstance } from "@/store/pages/base-page";
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
  editorRef?: EditorRefApi | null;
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
          captureSuccess({
            eventName: PROJECT_PAGE_TRACKER_EVENTS.duplicate,
            payload: {
              id: page.id,
              state: "SUCCESS",
            },
          });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Page duplicated successfully.",
          });
        } catch (error: any) {
          captureError({
            eventName: PROJECT_PAGE_TRACKER_EVENTS.duplicate,
            error,
          });
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
        const eventName = PROJECT_PAGE_TRACKER_EVENTS.access_update;

        try {
          if (access === EPageAccess.PUBLIC)
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "make-private" });
          else await executeCollaborativeAction({ type: "sendMessageToServer", message: "make-public" });

          captureSuccess({
            eventName,
            payload: {
              id: page.id,
              from_access: access === EPageAccess.PUBLIC ? "Public" : "Private",
              to_access: access === EPageAccess.PUBLIC ? "Private" : "Public",
              state: "SUCCESS",
            },
          });

          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `The page has been marked ${changedPageType} and moved to the ${changedPageType} section.`,
          });
        } catch (error: any) {
          captureError({
            eventName,
            error,
          });
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
            captureSuccess({
              eventName: PROJECT_PAGE_TRACKER_EVENTS.restore,
              payload: {
                id: page.id,
                state: "SUCCESS",
              },
            });
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page restored successfully.",
            });
          } catch (error: any) {
            captureError({
              eventName: PROJECT_PAGE_TRACKER_EVENTS.restore,
              error,
            });
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be restored. Please try again later.",
            });
          }
        } else {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "archive" });
            captureSuccess({
              eventName: PROJECT_PAGE_TRACKER_EVENTS.archive,
              payload: {
                id: page.id,
                state: "SUCCESS",
              },
            });
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page archived successfully.",
            });
          } catch (error: any) {
            captureError({
              eventName: PROJECT_PAGE_TRACKER_EVENTS.archive,
              error,
            });
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
          removePageFromFavorites()
            .then(() => {
              captureSuccess({
                eventName: PROJECT_PAGE_TRACKER_EVENTS.unfavorite,
                payload: {
                  id: page.id,
                  state: "SUCCESS",
                },
              });
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Success!",
                message: "Page removed from favorites.",
              });
            })
            .catch((error) => {
              captureError({
                eventName: PROJECT_PAGE_TRACKER_EVENTS.unfavorite,
                error,
              });
            });
        } else {
          addToFavorites()
            .then(() => {
              captureSuccess({
                eventName: PROJECT_PAGE_TRACKER_EVENTS.favorite,
                payload: {
                  id: page.id,
                  state: "SUCCESS",
                },
              });
              if (!isFavoriteMenuOpen) toggleFavoriteMenu(true);
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Success!",
                message: "Page added to favorites.",
              });
            })
            .catch((error) => {
              captureError({
                eventName: PROJECT_PAGE_TRACKER_EVENTS.favorite,
                error,
              });
            });
        }
      },
      toggleLock: async () => {
        if (is_locked) {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "unlock" });
            captureSuccess({
              eventName: PROJECT_PAGE_TRACKER_EVENTS.unlock,
              payload: {
                id: page.id,
                state: "SUCCESS",
              },
            });
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page unlocked successfully.",
            });
          } catch (error: any) {
            captureError({
              eventName: PROJECT_PAGE_TRACKER_EVENTS.unlock,
              error,
            });
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be unlocked. Please try again later.",
            });
          }
        } else {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "lock" });
            captureSuccess({
              eventName: PROJECT_PAGE_TRACKER_EVENTS.lock,
              payload: {
                id: page.id,
                state: "SUCCESS",
              },
            });
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page locked successfully.",
            });
          } catch (error: any) {
            captureError({
              eventName: PROJECT_PAGE_TRACKER_EVENTS.lock,
              error,
            });
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
    page.id,
    removePageFromFavorites,
    toggleFavoriteMenu,
  ]);
  return {
    pageOperations,
  };
};
