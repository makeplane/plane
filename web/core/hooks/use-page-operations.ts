import { useMemo } from "react";
import { useParams } from "next/navigation";
// plane editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
// plane ui
import { setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useCollaborativePageActions } from "@/hooks/use-collaborative-page-actions";
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

type Props = {
  editorRef?: EditorRefApi | EditorReadOnlyRefApi | null;
  page: IPage;
};

export const usePageOperations = (
  props: Props
): {
  pageOperations: TPageOperations;
} => {
  const { page } = props;
  // params
  const { workspaceSlug, projectId } = useParams();
  // derived values
  const {
    access,
    addToFavorites,
    archived_at,
    duplicate,
    id,
    is_favorite,
    is_locked,
    makePrivate,
    makePublic,
    removePageFromFavorites,
  } = page;
  // collaborative actions
  const { executeCollaborativeAction } = useCollaborativePageActions(props);
  // page operations
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
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "unarchive" });
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
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "archive" });
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
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "unlock" });
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
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "lock" });
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
    archived_at,
    duplicate,
    executeCollaborativeAction,
    id,
    is_favorite,
    is_locked,
    makePrivate,
    makePublic,
    projectId,
    removePageFromFavorites,
    workspaceSlug,
  ]);
  return {
    pageOperations,
  };
};
