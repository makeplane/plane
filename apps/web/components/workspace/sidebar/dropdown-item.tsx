/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// Base UI directly, not propel's `MenuItem`: the row body is a rich block (logo, role, member count
// and the active row's two action links) and propel's row builds its content from
// `label`/`icon`/`trailing`, which cannot hold it.
import { Menu } from "@base-ui/react/menu";
import { SettingsOutline, TickOutline, UserPlusOutline } from "@makeplane/propel/icons";
import { Button } from "@makeplane/propel/elements/button";
import { WorkspaceAvatar } from "@makeplane/propel/components/workspace-avatar";
// plane imports
import { EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IWorkspace } from "@plane/types";
import { cn, getFileURL, getUserRole } from "@plane/utils";

type TProps = {
  workspace: IWorkspace;
  activeWorkspace: IWorkspace | null;
  handleItemClick: () => void;
  handleWorkspaceNavigation: (workspace: IWorkspace) => void;
  handleClose: () => void;
};
const SidebarDropdownItem = observer(function SidebarDropdownItem(props: TProps) {
  const { workspace, activeWorkspace, handleItemClick, handleWorkspaceNavigation, handleClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { t } = useTranslation();
  // derived values
  const isActiveWorkspace = workspace.id === activeWorkspace?.id;

  return (
    <div
      className={cn("w-full px-4 py-2", {
        "bg-layer-transparent-active": isActiveWorkspace,
      })}
    >
      <Menu.Item
        render={<Link href={`/${workspace.slug}`} />}
        id={workspace.id}
        aria-current={isActiveWorkspace ? "page" : undefined}
        onClick={() => {
          handleWorkspaceNavigation(workspace);
          handleItemClick();
        }}
        className={cn(
          "flex items-center justify-between gap-2 rounded-sm p-1 text-body-xs-regular text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-strong",
          {
            "hover:bg-layer-transparent-hover data-highlighted:bg-layer-transparent-hover": !isActiveWorkspace,
          }
        )}
      >
        <div className="relative flex min-w-0 flex-1 items-center justify-start gap-2">
          <WorkspaceAvatar size="lg" src={getFileURL(workspace.logo_url ?? "")} alt={workspace.name} aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div
              className={`truncate text-left text-body-xs-regular ${workspaceSlug === workspace.slug ? "" : "text-secondary"}`}
            >
              {workspace.name}
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-caption-md-regular text-tertiary capitalize">
              <span className="min-w-0 truncate">{getUserRole(workspace.role)?.toLowerCase() || "guest"}</span>
              <span aria-hidden className="size-1 shrink-0 rounded-full bg-(--text-color-placeholder)" />
              <span className="min-w-0 truncate capitalize">
                {t("member", { count: workspace.total_members || 0 })}
              </span>
            </div>
          </div>
        </div>
        {isActiveWorkspace ? (
          <span className="shrink-0">
            <TickOutline className="size-4 text-primary" />
          </span>
        ) : null}
      </Menu.Item>
      {isActiveWorkspace && (
        <div className="mt-2 mb-1 flex flex-wrap gap-2">
          {[EUserPermissions.ADMIN, EUserPermissions.MEMBER].includes(workspace?.role) && (
            <Menu.Item
              render={
                <Button
                  variant="secondary"
                  size="sm"
                  stretch="auto"
                  render={<Link href={`/${workspace.slug}/settings`} />}
                />
              }
              onClick={handleClose}
            >
              <SettingsOutline className="size-3.5 shrink-0" />
              {t("settings")}
            </Menu.Item>
          )}
          {[EUserPermissions.ADMIN].includes(workspace?.role) && (
            <Menu.Item
              render={
                <Button
                  variant="secondary"
                  size="sm"
                  stretch="auto"
                  render={<Link href={`/${workspace.slug}/settings/members`} />}
                />
              }
              onClick={handleClose}
            >
              <UserPlusOutline className="size-3.5 shrink-0" />
              {t("project_settings.members.invite_members.title")}
            </Menu.Item>
          )}
        </div>
      )}
    </div>
  );
});

export default SidebarDropdownItem;
