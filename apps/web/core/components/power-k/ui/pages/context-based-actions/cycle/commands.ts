import { useCallback } from "react";
import { useParams } from "next/navigation";
import { LinkIcon, Star, StarOff } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useUser } from "@/hooks/store/user";

export const usePowerKCycleContextBasedActions = (): TPowerKCommandConfig[] => {
  // navigation
  const { workspaceSlug, cycleId } = useParams();
  // store
  const {
    permission: { allowPermissions },
  } = useUser();
  const { getCycleById, addCycleToFavorites, removeCycleFromFavorites } = useCycle();
  // derived values
  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : null;
  const isFavorite = !!cycleDetails?.is_favorite;
  // permission
  const isEditingAllowed =
    allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT) &&
    !cycleDetails?.archived_at;

  const toggleFavorite = useCallback(() => {
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
  }, [addCycleToFavorites, removeCycleFromFavorites, workspaceSlug, cycleDetails, isFavorite]);

  const copyCycleUrlToClipboard = useCallback(() => {
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
  }, []);

  return [
    {
      id: "toggle-cycle-favorite",
      i18n_title: isFavorite
        ? "power_k.contextual_actions.cycle.remove_from_favorites"
        : "power_k.contextual_actions.cycle.add_to_favorites",
      icon: isFavorite ? StarOff : Star,
      group: "contextual",
      contextType: "cycle",
      type: "action",
      action: toggleFavorite,
      modifierShortcut: "shift+f",
      isEnabled: () => isEditingAllowed,
      isVisible: () => isEditingAllowed,
      closeOnSelect: true,
    },
    {
      id: "copy-cycle-url",
      i18n_title: "power_k.contextual_actions.cycle.copy_url",
      icon: LinkIcon,
      group: "contextual",
      contextType: "cycle",
      type: "action",
      action: copyCycleUrlToClipboard,
      modifierShortcut: "cmd+shift+,",
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
  ];
};
