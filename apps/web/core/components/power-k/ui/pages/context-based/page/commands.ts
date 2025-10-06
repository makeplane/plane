import { useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  Globe2,
  LinkIcon,
  Lock,
  LockKeyhole,
  LockKeyholeOpen,
  Star,
  StarOff,
} from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EPageAccess } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// plane web imports
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

export const usePowerKPageContextBasedActions = (): TPowerKCommandConfig[] => {
  // navigation
  const { pageId } = useParams();
  // store hooks
  const { getPageById } = usePageStore(EPageStoreType.PROJECT);
  // derived values
  const page = pageId ? getPageById(pageId.toString()) : null;
  const {
    access,
    archived_at,
    canCurrentUserArchivePage,
    canCurrentUserChangeAccess,
    canCurrentUserFavoritePage,
    canCurrentUserLockPage,
    addToFavorites,
    removePageFromFavorites,
    lock,
    unlock,
    makePrivate,
    makePublic,
    archive,
    restore,
  } = page ?? {};
  const isFavorite = !!page?.is_favorite;
  const isLocked = !!page?.is_locked;
  // translation
  const { t } = useTranslation();

  const toggleFavorite = useCallback(() => {
    try {
      if (isFavorite) addToFavorites?.();
      else removePageFromFavorites?.();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Some error occurred",
      });
    }
  }, [addToFavorites, removePageFromFavorites, isFavorite]);

  const copyPageUrlToClipboard = useCallback(() => {
    const url = new URL(window.location.href);
    copyTextToClipboard(url.href)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("power_k.contextual_actions.page.copy_url_toast_success"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("power_k.contextual_actions.page.copy_url_toast_error"),
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [
    {
      id: "toggle_page_lock",
      i18n_title: isLocked ? "power_k.contextual_actions.page.unlock" : "power_k.contextual_actions.page.lock",
      icon: isLocked ? LockKeyholeOpen : LockKeyhole,
      group: "contextual",
      contextType: "page",
      type: "action",
      action: () => {
        if (isLocked) unlock?.();
        else lock?.();
      },
      modifierShortcut: "shift+l",
      isEnabled: () => !!canCurrentUserLockPage,
      isVisible: () => !!canCurrentUserLockPage,
      closeOnSelect: true,
    },
    {
      id: "toggle_page_access",
      i18n_title:
        access === EPageAccess.PUBLIC
          ? "power_k.contextual_actions.page.make_private"
          : "power_k.contextual_actions.page.make_public",
      icon: access === EPageAccess.PUBLIC ? Lock : Globe2,
      group: "contextual",
      contextType: "page",
      type: "action",
      action: () => {
        if (access === EPageAccess.PUBLIC) makePrivate?.();
        else makePublic?.();
      },
      modifierShortcut: "shift+a",
      isEnabled: () => !!canCurrentUserChangeAccess,
      isVisible: () => !!canCurrentUserChangeAccess,
      closeOnSelect: true,
    },
    {
      id: "toggle_page_archive",
      i18n_title: archived_at ? "power_k.contextual_actions.page.restore" : "power_k.contextual_actions.page.archive",
      icon: archived_at ? ArchiveRestoreIcon : ArchiveIcon,
      group: "contextual",
      contextType: "page",
      type: "action",
      action: () => {
        if (archived_at) restore?.();
        else archive?.();
      },
      modifierShortcut: "shift+r",
      isEnabled: () => !!canCurrentUserArchivePage,
      isVisible: () => !!canCurrentUserArchivePage,
      closeOnSelect: true,
    },
    {
      id: "toggle_page_favorite",
      i18n_title: isFavorite
        ? "power_k.contextual_actions.page.remove_from_favorites"
        : "power_k.contextual_actions.page.add_to_favorites",
      icon: isFavorite ? StarOff : Star,
      group: "contextual",
      contextType: "page",
      type: "action",
      action: () => toggleFavorite(),
      modifierShortcut: "shift+f",
      isEnabled: () => !!canCurrentUserFavoritePage,
      isVisible: () => !!canCurrentUserFavoritePage,
      closeOnSelect: true,
    },
    {
      id: "copy_page_url",
      i18n_title: "power_k.contextual_actions.page.copy_url",
      icon: LinkIcon,
      group: "contextual",
      contextType: "page",
      type: "action",
      action: copyPageUrlToClipboard,
      modifierShortcut: "cmd+shift+,",
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
  ];
};
