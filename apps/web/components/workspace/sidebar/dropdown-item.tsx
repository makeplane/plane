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
          "flex items-center justify-between gap-1 rounded-sm p-1 text-13 text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-strong",
          {
            "hover:bg-layer-transparent-hover data-highlighted:bg-layer-transparent-hover": !isActiveWorkspace,
          }
        )}
      >
        <div className="relative flex w-[80%] items-center justify-start gap-2.5">
          <span
            className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center border-subtle p-2 text-14 font-medium uppercase ${
              !workspace?.logo_url && "rounded-md bg-[#026292] text-on-color"
            }`}
          >
            {workspace?.logo_url && workspace.logo_url !== "" ? (
              <img
                src={getFileURL(workspace.logo_url)}
                className="absolute top-0 left-0 h-full w-full rounded-sm object-cover"
                alt={t("workspace_logo")}
              />
            ) : (
              (workspace?.name?.[0] ?? "...")
            )}
          </span>
          <div className="w-[inherit]">
            <div
              className={`truncate text-left text-13 font-medium text-ellipsis ${workspaceSlug === workspace.slug ? "" : "text-secondary"}`}
            >
              {workspace.name}
            </div>
            <div className="flex w-fit gap-2 text-13 text-tertiary capitalize">
              <span>{getUserRole(workspace.role)?.toLowerCase() || "guest"}</span>
              <div className="m-auto h-1 w-1 rounded-full bg-layer-1/50" />
              <span className="capitalize">{t("member", { count: workspace.total_members || 0 })}</span>
            </div>
          </div>
        </div>
        {isActiveWorkspace ? (
          <span className="flex-shrink-0 p-1">
            <TickOutline className="h-5 w-5 text-primary" />
          </span>
        ) : null}
      </Menu.Item>
      {isActiveWorkspace && (
        <div className="mt-2 mb-1 flex gap-2">
          {[EUserPermissions.ADMIN, EUserPermissions.MEMBER].includes(workspace?.role) && (
            <Menu.Item
              render={
                <Button
                  variant="secondary"
                  size="lg"
                  stretch="auto"
                  render={<Link href={`/${workspace.slug}/settings`} />}
                />
              }
              onClick={handleClose}
            >
              <SettingsOutline className="size-4 shrink-0" />
              {t("settings")}
            </Menu.Item>
          )}
          {[EUserPermissions.ADMIN].includes(workspace?.role) && (
            <Menu.Item
              render={
                <Button
                  variant="secondary"
                  size="lg"
                  stretch="auto"
                  render={<Link href={`/${workspace.slug}/settings/members`} />}
                />
              }
              onClick={handleClose}
            >
              <UserPlusOutline className="size-4 shrink-0" />
              {t("project_settings.members.invite_members.title")}
            </Menu.Item>
          )}
        </div>
      )}
    </div>
  );
});

export default SidebarDropdownItem;
