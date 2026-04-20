/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { Star, StarOff } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { LinkIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { copyTextToClipboard } from "@plane/utils";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useFavorite } from "@/hooks/store/use-favorite";

export const usePowerKCycleContextBasedActions = (): TPowerKCommandConfig[] => {
  // navigation
  const { workspaceSlug, cycleId } = useParams();
  // store
  const { getCycleById, addCycleToFavorites, removeCycleFromFavorites } = useCycle();
  const { permissions: favoritePermissions } = useFavorite();
  // derived values
  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : null;
  const isFavorite = !!cycleDetails?.is_favorite;
  // permission
  const canFavoriteCycle =
    workspaceSlug && favoritePermissions.getCanCreate(workspaceSlug) && cycleDetails?.archived_at === null;
  // translation
  const { t } = useTranslation();

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
          title: t("power_k.contextual_actions.cycle.copy_url_toast_success"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("power_k.contextual_actions.cycle.copy_url_toast_error"),
        });
      });
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [
    {
      id: "toggle_cycle_favorite",
      i18n_title: isFavorite
        ? "power_k.contextual_actions.cycle.remove_from_favorites"
        : "power_k.contextual_actions.cycle.add_to_favorites",
      icon: isFavorite ? StarOff : Star,
      group: "contextual",
      contextType: "cycle",
      type: "action",
      action: toggleFavorite,
      modifierShortcut: "shift+f",
      isEnabled: () => Boolean(canFavoriteCycle),
      isVisible: () => Boolean(canFavoriteCycle),
      closeOnSelect: true,
    },
    {
      id: "copy_cycle_url",
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
