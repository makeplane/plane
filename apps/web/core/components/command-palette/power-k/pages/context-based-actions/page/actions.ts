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
import { EPageAccess } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import type { ContextBasedAction, TPowerKPageKeys } from "../../../types";

type TArgs = {
  handleClose: () => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  page: TPageInstance | undefined | null;
};

export const getPowerKPageContextBasedActions = (args: TArgs): ContextBasedAction[] => {
  const { handleClose, page } = args;
  // store
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
  // derived values
  const isFavorite = !!page?.is_favorite;
  const isLocked = !!page?.is_locked;

  const copyModuleUrlToClipboard = () => {
    const url = new URL(window.location.href);
    copyTextToClipboard(url.href)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Copied to clipboard",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Some error occurred",
        });
      });
  };

  const toggleFavorite = () => {
    try {
      if (isFavorite) addToFavorites?.();
      else removePageFromFavorites?.();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Some error occurred",
      });
    }
    handleClose();
  };

  return [
    {
      key: "toggle-lock",
      i18n_label: isLocked ? "power_k.contextual_actions.page.unlock" : "power_k.contextual_actions.page.lock",
      icon: isLocked ? LockKeyholeOpen : LockKeyhole,
      action: () => {
        if (isLocked) unlock?.();
        else lock?.();
        handleClose();
      },
      shouldRender: canCurrentUserLockPage,
    },
    {
      key: "toggle-access",
      i18n_label:
        access === EPageAccess.PUBLIC
          ? "power_k.contextual_actions.page.make_private"
          : "power_k.contextual_actions.page.make_public",
      icon: access === EPageAccess.PUBLIC ? Lock : Globe2,
      action: () => {
        if (access === EPageAccess.PUBLIC) makePrivate?.();
        else makePublic?.();
        handleClose();
      },
      shouldRender: canCurrentUserChangeAccess,
    },
    {
      key: "toggle-archive",
      i18n_label: archived_at ? "power_k.contextual_actions.page.restore" : "power_k.contextual_actions.page.archive",
      icon: archived_at ? ArchiveRestoreIcon : ArchiveIcon,
      action: () => {
        if (archived_at) restore?.();
        else archive?.();
        handleClose();
      },
      shouldRender: canCurrentUserArchivePage,
    },
    {
      key: "toggle-favorite",
      i18n_label: isFavorite
        ? "power_k.contextual_actions.page.remove_from_favorites"
        : "power_k.contextual_actions.page.add_to_favorites",
      icon: isFavorite ? StarOff : Star,
      action: () => toggleFavorite(),
      shouldRender: canCurrentUserFavoritePage,
    },
    {
      key: "copy-url",
      i18n_label: "power_k.contextual_actions.page.copy_url",
      icon: LinkIcon,
      action: () => {
        handleClose();
        copyModuleUrlToClipboard();
      },
    },
  ];
};
