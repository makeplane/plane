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
import { Star, StarOff, Users } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { LinkIcon, ModuleStatusIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IModule, TModuleStatus } from "@plane/types";
import { copyTextToClipboard } from "@plane/utils";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useModule } from "@/hooks/store/use-module";
import { useFavorite } from "@/hooks/store/use-favorite";

export const usePowerKModuleContextBasedActions = (): TPowerKCommandConfig[] => {
  // navigation
  const { workspaceSlug, projectId, moduleId } = useParams();
  // store
  const {
    getModuleById,
    addModuleToFavorites,
    removeModuleFromFavorites,
    updateModuleDetails,
    permissions: modulePermissions,
  } = useModule();
  const { permissions: favoritePermissions } = useFavorite();
  // derived values
  const moduleDetails = moduleId ? getModuleById(moduleId.toString()) : null;
  const isFavorite = !!moduleDetails?.is_favorite;
  // permission
  const canEditModule =
    moduleId && workspaceSlug ? modulePermissions.getCanEditModule(workspaceSlug, projectId, moduleId) : false;
  const canFavoriteModule =
    workspaceSlug && favoritePermissions.getCanCreate(workspaceSlug) && moduleDetails?.archived_at === null;
  // translation
  const { t } = useTranslation();

  const handleUpdateModule = useCallback(
    async (formData: Partial<IModule>) => {
      if (!workspaceSlug || !projectId || !moduleDetails) return;
      await updateModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleDetails.id, formData).catch(
        () => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Module could not be updated. Please try again.",
          });
        }
      );
    },
    [moduleDetails, projectId, updateModuleDetails, workspaceSlug]
  );

  const handleUpdateMember = useCallback(
    (memberId: string) => {
      if (!moduleDetails) return;

      const updatedMembers = moduleDetails.member_ids ?? [];
      if (updatedMembers.includes(memberId)) updatedMembers.splice(updatedMembers.indexOf(memberId), 1);
      else updatedMembers.push(memberId);

      handleUpdateModule({ member_ids: updatedMembers });
    },
    [handleUpdateModule, moduleDetails]
  );

  const toggleFavorite = useCallback(() => {
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
  }, [addModuleToFavorites, removeModuleFromFavorites, workspaceSlug, moduleDetails, isFavorite]);

  const copyModuleUrlToClipboard = useCallback(() => {
    const url = new URL(window.location.href);
    copyTextToClipboard(url.href)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("power_k.contextual_actions.module.copy_url_toast_success"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("power_k.contextual_actions.module.copy_url_toast_error"),
        });
      });
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [
    {
      id: "add_remove_module_members",
      i18n_title: "power_k.contextual_actions.module.add_remove_members",
      icon: Users,
      group: "contextual",
      contextType: "module",
      type: "change-page",
      page: "update-module-member",
      onSelect: (data) => {
        const memberId = data as string;
        handleUpdateMember(memberId);
      },
      shortcut: "m",
      isEnabled: () => Boolean(canEditModule),
      isVisible: () => Boolean(canEditModule),
      closeOnSelect: false,
    },
    {
      id: "change_module_status",
      i18n_title: "power_k.contextual_actions.module.change_status",
      iconNode: <ModuleStatusIcon status="backlog" className="shrink-0 size-3.5" />,
      group: "contextual",
      contextType: "module",
      type: "change-page",
      page: "update-module-status",
      onSelect: (data) => {
        const status = data as TModuleStatus;
        handleUpdateModule({ status });
      },
      shortcut: "s",
      isEnabled: () => Boolean(canEditModule),
      isVisible: () => Boolean(canEditModule),
      closeOnSelect: true,
    },
    {
      id: "toggle_module_favorite",
      i18n_title: isFavorite
        ? "power_k.contextual_actions.module.remove_from_favorites"
        : "power_k.contextual_actions.module.add_to_favorites",
      icon: isFavorite ? StarOff : Star,
      group: "contextual",
      contextType: "module",
      type: "action",
      action: toggleFavorite,
      modifierShortcut: "shift+f",
      isEnabled: () => Boolean(canFavoriteModule),
      isVisible: () => Boolean(canFavoriteModule),
      closeOnSelect: true,
    },
    {
      id: "copy_module_url",
      i18n_title: "power_k.contextual_actions.module.copy_url",
      icon: LinkIcon,
      group: "contextual",
      contextType: "module",
      type: "action",
      action: copyModuleUrlToClipboard,
      modifierShortcut: "cmd+shift+,",
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
  ];
};
