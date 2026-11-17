/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { ArchiveOutline, MoreHorizontalOutline, SettingsOutline } from "@makeplane/propel/icons";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
import { cn } from "@plane/utils";
// store hooks
import { useUserPermissions } from "@/hooks/store/user";

/**
 * The workspace section's header actions. Rendered as the `trailing` control of the section's
 * `Collapsible` (a sibling of its trigger), so it never toggles the section.
 */
export const SidebarWorkspaceMenuHeader = observer(function SidebarWorkspaceMenuHeader() {
  // state
  const [isMenuActive, setIsMenuActive] = useState(false);
  // hooks
  const { workspaceSlug } = useParams();
  const router = useRouter();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  // TODO: fix types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN] as any, EUserPermissionsLevel.WORKSPACE);

  return (
    <div
      className={cn(
        "pointer-events-none my-auto flex h-full flex-shrink-0 items-center opacity-0 group-hover/workspace-button:pointer-events-auto group-hover/workspace-button:opacity-100",
        {
          "pointer-events-auto opacity-100": isMenuActive,
        }
      )}
    >
      <Menu open={isMenuActive} onOpenChange={setIsMenuActive}>
        <MenuTrigger
          render={
            <IconButton
              variant="ghost"
              size="xs"
              aria-label={t("aria_labels.projects_sidebar.toggle_quick_actions_menu")}
              icon={<Icon icon={MoreHorizontalOutline} />}
            />
          }
        />
        <MenuContent side="bottom" align="start">
          <MenuItem
            icon={<Icon icon={ArchiveOutline} />}
            label={t("archives")}
            onClick={() => router.push(`/${workspaceSlug}/projects/archives`)}
          />
          {isAdmin && (
            <MenuItem
              icon={<Icon icon={SettingsOutline} />}
              label={t("settings")}
              onClick={() => router.push(`/${workspaceSlug}/settings`)}
            />
          )}
        </MenuContent>
      </Menu>
    </div>
  );
});
