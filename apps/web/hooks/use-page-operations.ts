/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useMemo } from "react";
// plane imports
import { IS_FAVORITE_MENU_OPEN } from "@plane/constants";
import { setToast } from "@plane/blocks/toast";
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
  const { t } = useTranslation();

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
          type: "success",
          title: t("link_copied"),
          message: t("wiki_collections.list.page_link_copied"),
        });
      },
      duplicate: async () => {
        try {
          await duplicate();
          setToast({
            type: "success",
            title: t("success"),
            message: t("web_ui.page_duplicated_successfully"),
          });
        } catch (_error) {
          setToast({
            type: "error",
            title: t("error"),
            message: t("web_ui.page_could_not_be_duplicated_please_try_again_later"),
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
            type: "success",
            title: t("success"),
            message: t("web_ui.dynamic_the_page_has_been_marked_value0_and_moved_to_the_value1_section", {
              value0: t(changedPageType),
              value1: t(changedPageType),
            }),
          });
        } catch (_error) {
          setToast({
            type: "error",
            title: t("error"),
            message: t("web_ui.dynamic_the_page_couldn_t_be_marked_value0_please_try_again", {
              value0: t(changedPageType),
            }),
          });
        }
      },
      toggleArchive: async () => {
        if (archived_at) {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "unarchive" });
            setToast({
              type: "success",
              title: t("success"),
              message: t("web_ui.page_restored_successfully"),
            });
          } catch (_error) {
            setToast({
              type: "error",
              title: t("error"),
              message: t("web_ui.page_could_not_be_restored_please_try_again_later"),
            });
          }
        } else {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "archive" });
            setToast({
              type: "success",
              title: t("success"),
              message: t("web_ui.page_archived_successfully"),
            });
          } catch (_error) {
            setToast({
              type: "error",
              title: t("error"),
              message: t("web_ui.page_could_not_be_archived_please_try_again_later"),
            });
          }
        }
      },
      toggleFavorite: async () => {
        if (is_favorite) {
          try {
            await removePageFromFavorites();
            setToast({
              type: "success",
              title: t("success"),
              message: t("web_ui.page_removed_from_favorites"),
            });
          } catch (_error) {
            setToast({
              type: "error",
              title: t("error"),
              message: t("web_ui.page_could_not_be_removed_from_favorites_please_try_again_later"),
            });
          }
        } else {
          try {
            await addToFavorites();
            if (!isFavoriteMenuOpen) toggleFavoriteMenu(true);
            setToast({
              type: "success",
              title: t("success"),
              message: t("web_ui.page_added_to_favorites"),
            });
          } catch (_error) {
            setToast({
              type: "error",
              title: t("error"),
              message: t("web_ui.page_could_not_be_added_to_favorites_please_try_again_later"),
            });
          }
        }
      },
      toggleLock: async () => {
        if (is_locked) {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "unlock" });
            setToast({
              type: "success",
              title: t("success"),
              message: t("web_ui.page_unlocked_successfully"),
            });
          } catch (_error) {
            setToast({
              type: "error",
              title: t("error"),
              message: t("web_ui.page_could_not_be_unlocked_please_try_again_later"),
            });
          }
        } else {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "lock" });
            setToast({
              type: "success",
              title: t("success"),
              message: t("web_ui.page_locked_successfully"),
            });
          } catch (_error) {
            setToast({
              type: "error",
              title: t("error"),
              message: t("web_ui.page_could_not_be_locked_please_try_again_later"),
            });
          }
        }
      },
    };
  }, [
    t,
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
