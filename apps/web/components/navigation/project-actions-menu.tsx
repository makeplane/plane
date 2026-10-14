/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ArchiveOutline,
  LinkOutline,
  LogOutOutline,
  MoreHorizontalOutline,
  SettingsOutline,
  ShareAltOutline,
} from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";

type Props = {
  workspaceSlug: string;
  project: {
    id: string;
  };
  isAdmin: boolean;
  isAuthorized: boolean;
  onCopyText: () => void;
  onLeaveProject: () => void;
  onPublishModal: () => void;
};

export function ProjectActionsMenu({
  workspaceSlug,
  project,
  isAdmin,
  isAuthorized,
  onCopyText,
  onLeaveProject,
  onPublishModal,
}: Props) {
  // states
  const [isMenuActive, setIsMenuActive] = useState(false);
  // translation
  const { t } = useTranslation();
  // refs
  const actionSectionRef = useRef<HTMLButtonElement | null>(null);
  // router
  const navigate = useNavigate();

  return (
    <div className="shrink-0">
      <Menu open={isMenuActive} onOpenChange={setIsMenuActive}>
        <MenuTrigger
          render={
            <button
              type="button"
              ref={actionSectionRef}
              className="grid place-items-center rounded-sm p-0.5 text-placeholder hover:bg-layer-1"
              aria-label={t("aria_labels.projects_sidebar.toggle_quick_actions_menu")}
            >
              <MoreHorizontalOutline className="size-4" />
            </button>
          }
        />
        <MenuContent side="bottom" align="start">
          {/* Publish project settings */}
          {isAdmin && (
            <MenuItem icon={<Icon icon={ShareAltOutline} />} label={t("publish_project")} onClick={onPublishModal} />
          )}
          <MenuItem icon={<Icon icon={LinkOutline} />} label={t("copy_link")} onClick={onCopyText} />
          {isAuthorized && (
            <MenuItem
              icon={<Icon icon={ArchiveOutline} />}
              label={t("archives")}
              onClick={() => {
                void navigate(`/${workspaceSlug}/projects/${project?.id}/archives/issues`);
              }}
            />
          )}
          <MenuItem
            icon={<Icon icon={SettingsOutline} />}
            label={t("settings")}
            onClick={() => {
              void navigate(`/${workspaceSlug}/settings/projects/${project?.id}`);
            }}
          />
          {/* Leave project */}
          {!isAuthorized && (
            <MenuItem icon={<Icon icon={LogOutOutline} />} label={t("leave_project")} onClick={onLeaveProject} />
          )}
        </MenuContent>
      </Menu>
    </div>
  );
}
