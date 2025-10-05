import { LinkIcon, Star, StarOff, Users } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { DoubleCircleIcon } from "@plane/propel/icons";
import { EUserPermissions, type IModule } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// components
import type { TPowerKPageType } from "@/components/power-k/core/types";
// lib
import { store } from "@/lib/store-context";

type TArgs = {
  handleClose: () => void;
  handleUpdatePage: (page: TPowerKPageType) => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  moduleDetails: IModule | undefined | null;
};

export const getPowerKModuleContextBasedActions = (args: TArgs): ContextBasedAction[] => {
  const { handleClose, handleUpdatePage, handleUpdateSearchTerm, moduleDetails } = args;
  // store
  const { workspaceSlug } = store.router;
  const { allowPermissions } = store.user.permission;
  const { addModuleToFavorites, removeModuleFromFavorites } = store.module;
  // derived values
  const isFavorite = !!moduleDetails?.is_favorite;
  // permission
  const isEditingAllowed =
    allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT) &&
    !moduleDetails?.archived_at;

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
    if (!workspaceSlug || !moduleDetails || !moduleDetails.project_id) return;
    try {
      if (isFavorite) removeModuleFromFavorites(workspaceSlug.toString(), moduleDetails.project_id, moduleDetails.id);
      else addModuleToFavorites(workspaceSlug.toString(), moduleDetails.project_id, moduleDetails.id);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Some error occurred",
      });
    }
  };

  return [
    {
      key: "add-remove-members",
      i18n_label: "power_k.contextual_actions.module.add_remove_members",
      icon: Users,
      action: () => {
        handleUpdateSearchTerm("");
        handleUpdatePage("change-module-member");
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "change-status",
      i18n_label: "power_k.contextual_actions.module.change_status",
      icon: DoubleCircleIcon,
      action: () => {
        handleUpdateSearchTerm("");
        handleUpdatePage("change-module-status");
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "toggle-favorite",
      i18n_label: isFavorite
        ? "power_k.contextual_actions.module.remove_from_favorites"
        : "power_k.contextual_actions.module.add_to_favorites",
      icon: isFavorite ? StarOff : Star,
      action: () => {
        handleClose();
        toggleFavorite();
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "copy-url",
      i18n_label: "power_k.contextual_actions.module.copy_url",
      icon: LinkIcon,
      action: () => {
        handleClose();
        copyModuleUrlToClipboard();
      },
    },
  ];
};
