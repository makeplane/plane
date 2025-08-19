import { useMemo } from "react";
// constants
import { IS_FAVORITE_MENU_OPEN, PROJECT_PAGE_TRACKER_EVENTS } from "@plane/constants";
import { EditorRefApi } from "@plane/editor";
import { useLocalStorage } from "@plane/hooks";
import { EPageAccess } from "@plane/types";
// ui
import { setToast, TOAST_TYPE } from "@plane/ui";
import { copyUrlToClipboard } from "@plane/utils";
// helpers
import { captureSuccess, captureError } from "@/helpers/event-tracker.helper";
// hooks
import { useCollaborativePageActions } from "@/hooks/use-collaborative-page-actions";
// store types
import { TPageInstance } from "@/store/pages/base-page";

export type TPageOperations = {
  toggleLock: ({ recursive }: { recursive?: boolean }) => void;
  toggleAccess: () => void;
  toggleFavorite: () => void;
  openInNewTab: () => void;
  copyLink: () => void;
  duplicate: (realtimeEvents?: boolean) => void;
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
      duplicate: async (realtimeEvents = true) => {
        try {
          setToast({
            id: "duplicating-page",
            type: TOAST_TYPE.LOADING_TOAST,
            title: "Duplicating page...",
          });
          await duplicate();
          if (realtimeEvents) return;
          setTimeout(() => {
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page duplicated successfully.",
            });
          }, 3000);
          captureSuccess({
            eventName: PROJECT_PAGE_TRACKER_EVENTS.duplicate,
            payload: {
              id: page.id,
              state: "SUCCESS",
            },
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
      toggleLock: async ({ recursive = false }: { recursive?: boolean } = {}) => {
        if (is_locked) {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "unlock", recursive });
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page unlocked successfully.",
            });
            captureSuccess({
              eventName: PROJECT_PAGE_TRACKER_EVENTS.unlock,
              payload: {
                id: page.id,
                state: "SUCCESS",
              },
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
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "lock", recursive });
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page locked successfully.",
            });
            captureSuccess({
              eventName: PROJECT_PAGE_TRACKER_EVENTS.lock,
              payload: {
                id: page.id,
                state: "SUCCESS",
              },
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
