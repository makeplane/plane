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

import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { LogOut, MoreHorizontal, Settings, Share2, ArchiveIcon, Star } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { LinkIcon } from "@plane/propel/icons";
import { CustomMenu } from "@plane/ui";

type Props = {
  workspaceSlug: string;
  project: {
    id: string;
  };
  onCopyText: () => void;
  onLeaveProject: () => void;
  onPublishModal: () => void;
  isFavorite?: boolean;
  handleAddToFavorites: () => void;
  handleRemoveFromFavorites: () => void;
  className?: string;
  permissions: {
    canVisitArchives: boolean;
    canPublish: boolean;
    canFavorite: boolean;
    canManage: boolean;
    canLeave: boolean;
  };
};

export function ProjectActionsMenu({
  workspaceSlug,
  project,
  onCopyText,
  onLeaveProject,
  onPublishModal,
  isFavorite,
  handleAddToFavorites,
  handleRemoveFromFavorites,
  className,
  permissions,
}: Props) {
  // states
  const [isMenuActive, setIsMenuActive] = useState(false);
  // translation
  const { t } = useTranslation();
  // refs
  const actionSectionRef = useRef<HTMLDivElement | null>(null);
  // router
  const navigate = useNavigate();

  return (
    <CustomMenu
      customButton={
        <span
          ref={actionSectionRef}
          className="grid place-items-center p-0.5 text-placeholder hover:bg-layer-1 rounded-sm"
          onClick={() => setIsMenuActive(!isMenuActive)}
        >
          <MoreHorizontal className="size-4" />
        </span>
      }
      className={cn("flex-shrink-0", className)}
      customButtonClassName="grid place-items-center"
      placement="bottom-start"
      ariaLabel={t("aria_labels.projects_sidebar.toggle_quick_actions_menu")}
      useCaptureForOutsideClick
      closeOnSelect
      onMenuClose={() => setIsMenuActive(false)}
    >
      {permissions.canFavorite && (
        <CustomMenu.MenuItem onClick={isFavorite ? handleRemoveFromFavorites : handleAddToFavorites}>
          <span className="flex items-center justify-start gap-2">
            <Star
              className={cn("h-3.5 w-3.5 ", {
                "fill-yellow-500 stroke-yellow-500": isFavorite,
              })}
            />
            <span>{isFavorite ? t("remove_from_favorites") : t("add_to_favorites")}</span>
          </span>
        </CustomMenu.MenuItem>
      )}
      {/* Publish project settings */}
      {permissions.canPublish && (
        <CustomMenu.MenuItem onClick={onPublishModal}>
          <div className="relative flex flex-shrink-0 items-center justify-start gap-2">
            <div className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-sm text-secondary transition-all duration-300 hover:bg-layer-1">
              <Share2 className="h-3.5 w-3.5 stroke-[1.5]" />
            </div>
            <div>{t("publish_project")}</div>
          </div>
        </CustomMenu.MenuItem>
      )}
      <CustomMenu.MenuItem onClick={onCopyText}>
        <span className="flex items-center justify-start gap-2">
          <LinkIcon className="h-3.5 w-3.5 stroke-[1.5]" />
          <span>{t("copy_link")}</span>
        </span>
      </CustomMenu.MenuItem>
      {permissions.canVisitArchives && (
        <CustomMenu.MenuItem
          onClick={() => {
            navigate(`/${workspaceSlug}/projects/${project?.id}/archives/issues/`);
          }}
        >
          <div className="flex items-center justify-start gap-2 cursor-pointer">
            <ArchiveIcon className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>{t("archives")}</span>
          </div>
        </CustomMenu.MenuItem>
      )}
      {permissions.canManage && (
        <CustomMenu.MenuItem
          onClick={() => {
            navigate(`/${workspaceSlug}/settings/projects/${project?.id}`);
          }}
        >
          <div className="flex items-center justify-start gap-2 cursor-pointer">
            <Settings className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>{t("settings")}</span>
          </div>
        </CustomMenu.MenuItem>
      )}
      {/* Leave project */}
      {permissions.canLeave && (
        <CustomMenu.MenuItem onClick={onLeaveProject}>
          <div className="flex items-center justify-start gap-2">
            <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>{t("leave_project")}</span>
          </div>
        </CustomMenu.MenuItem>
      )}
    </CustomMenu>
  );
}
