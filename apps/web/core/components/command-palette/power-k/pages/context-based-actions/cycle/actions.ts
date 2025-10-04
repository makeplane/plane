import { LinkIcon, Star, StarOff } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import type { ICycle } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// lib
import { store } from "@/lib/store-context";
// local imports
import type { ContextBasedAction, TPowerKPageKeys } from "../../../types";

type TArgs = {
  cycleDetails: ICycle | undefined | null;
  handleClose: () => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
};

export const getPowerKCycleContextBasedActions = (args: TArgs): ContextBasedAction[] => {
  const { cycleDetails, handleClose } = args;
  // store
  const { workspaceSlug } = store.router;
  const { allowPermissions } = store.user.permission;
  const { addCycleToFavorites, removeCycleFromFavorites } = store.cycle;
  // derived values
  const isFavorite = !!cycleDetails?.is_favorite;
  // permission
  const isEditingAllowed =
    allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT) &&
    !cycleDetails?.archived_at;

  const toggleFavorite = () => {
    if (!workspaceSlug || !cycleDetails || !cycleDetails.project_id) return;
    try {
      if (isFavorite) removeCycleFromFavorites(workspaceSlug.toString(), cycleDetails.project_id, cycleDetails.id);
      else addCycleToFavorites(workspaceSlug.toString(), cycleDetails.project_id, cycleDetails.id);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Some error occurred",
      });
    }
  };

  const copyCycleUrlToClipboard = () => {
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

  return [
    {
      key: "toggle-favorite",
      i18n_label: isFavorite
        ? "power_k.contextual_actions.cycle.remove_from_favorites"
        : "power_k.contextual_actions.cycle.add_to_favorites",
      icon: isFavorite ? StarOff : Star,
      action: () => {
        handleClose();
        toggleFavorite();
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "copy-url",
      i18n_label: "power_k.contextual_actions.cycle.copy_url",
      icon: LinkIcon,
      action: () => {
        handleClose();
        copyCycleUrlToClipboard();
      },
    },
  ];
};
