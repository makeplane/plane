/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DeleteOutline,
  LeadOutline,
  LinkOutline,
  LockOutline,
  MoreHorizontalOutline,
  NewTabOutline,
  RestoreOutline,
  SettingsOutline,
  UserPlusOutline,
} from "@makeplane/propel/icons";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, IS_FAVORITE_MENU_OPEN } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@makeplane/propel/components/avatar";
import { AvatarGroup } from "@makeplane/propel/components/avatar-group";
import { Badge } from "@makeplane/propel/components/badge";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { Logo } from "@plane/blocks/emoji-icon-picker";
import { setPromiseToast, setToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { IProject, IUserLite } from "@plane/types";
import type { TContextMenuItem } from "@plane/blocks/context-menu";
import { ContextMenu, getRenderableItems, resolveItemVariant } from "@plane/blocks/context-menu";
import { FavoriteStar } from "@plane/blocks/common";
import { copyUrlToClipboard, cn, getFileURL } from "@plane/utils";
// components
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { CoverImage } from "@/components/common/cover-image";
import { DeleteProjectModal } from "./delete-project-modal";
import { JoinProjectModal } from "./join-project-modal";
import { ArchiveRestoreProjectModal } from "./archive-restore-modal";

type Props = {
  project: IProject;
};

/** Keeps clicks and activation keys inside the hover actions from reaching the card link. */
const stopCardNavigation = {
  onClick: (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  },
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") e.stopPropagation();
  },
};

export const ProjectCard = observer(function ProjectCard(props: Props) {
  const { project } = props;
  // states
  const [deleteProjectModalOpen, setDeleteProjectModal] = useState(false);
  const [joinProjectModalOpen, setJoinProjectModal] = useState(false);
  const [restoreProject, setRestoreProject] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // refs
  const projectCardRef = useRef(null);
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getUserDetails } = useMember();
  const { addProjectToFavorites, removeProjectFromFavorites } = useProject();
  const { allowPermissions } = useUserPermissions();
  // hooks
  const { isMobile } = usePlatformOS();
  // derived values
  const projectMembers = (project.members ?? []).flatMap((memberId) => {
    const member = getUserDetails(memberId);
    return member ? [member] : [];
  });
  const projectLeadId =
    typeof project.project_lead === "string" ? project.project_lead : (project.project_lead as IUserLite | null)?.id;
  const projectLead = projectLeadId ? getUserDetails(projectLeadId) : undefined;
  const shouldRenderFavorite = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  // auth
  const isMemberOfProject = !!project.member_role;
  const hasAdminRole = project.member_role === EUserPermissions.ADMIN;
  const hasMemberRole = project.member_role === EUserPermissions.MEMBER;
  // archive
  const isArchived = !!project.archived_at;
  // local storage
  const { setValue: toggleFavoriteMenu, storedValue: isFavoriteMenuOpen } = useLocalStorage<boolean>(
    IS_FAVORITE_MENU_OPEN,
    false
  );
  const handleAddToFavorites = () => {
    if (!workspaceSlug) return;

    const addToFavoritePromise = addProjectToFavorites(workspaceSlug.toString(), project.id);
    setPromiseToast(addToFavoritePromise, {
      loading: "Adding project to favorites...",
      success: {
        title: "Success!",
        message: () => "Project added to favorites.",
        // propel: the callback exists for its side effect; a toast action is data, and there is
        // none here, so it returns an empty list rather than an empty fragment.
        actionItems: () => {
          if (!isFavoriteMenuOpen) toggleFavoriteMenu(true);
          return [];
        },
      },
      error: {
        title: "Error!",
        message: () => "Couldn't add the project to favorites. Please try again.",
      },
    });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug) return;

    const removeFromFavoritePromise = removeProjectFromFavorites(workspaceSlug.toString(), project.id);
    setPromiseToast(removeFromFavoritePromise, {
      loading: "Removing project from favorites...",
      success: {
        title: "Success!",
        message: () => "Project removed from favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't remove the project from favorites. Please try again.",
      },
    });
  };

  const projectLink = `${workspaceSlug}/projects/${project.id}/issues`;
  const handleCopyText = () =>
    copyUrlToClipboard(projectLink).then(() =>
      setToast({
        type: "info",
        title: "Link Copied!",
        message: "Project link copied to clipboard.",
      })
    );
  const handleOpenInNewTab = () => window.open(`/${projectLink}`, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "settings",
      action: () => router.push(`/${workspaceSlug}/settings/projects/${project.id}`),
      title: t("settings"),
      icon: SettingsOutline,
      shouldRender: !isArchived && (hasAdminRole || hasMemberRole),
    },
    {
      key: "join",
      action: () => setJoinProjectModal(true),
      title: t("common.join"),
      icon: UserPlusOutline,
      shouldRender: !isMemberOfProject && !isArchived,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: t("open_in_new_tab"),
      icon: NewTabOutline,
      shouldRender: !isMemberOfProject && !isArchived,
    },
    {
      key: "copy-link",
      action: () => void handleCopyText(),
      title: t("copy_link"),
      icon: LinkOutline,
      shouldRender: !isArchived,
    },
    {
      key: "restore",
      action: () => setRestoreProject(true),
      title: t("restore"),
      icon: RestoreOutline,
      shouldRender: isArchived && hasAdminRole,
    },
    {
      key: "delete",
      action: () => setDeleteProjectModal(true),
      title: t("delete"),
      icon: DeleteOutline,
      variant: "danger",
      shouldRender: isArchived && hasAdminRole,
    },
  ];
  const menuItems = getRenderableItems(MENU_ITEMS);
  const showFavorite = !isArchived && shouldRenderFavorite;

  return (
    <>
      {/* Delete Project Modal */}
      <DeleteProjectModal
        project={project}
        isOpen={deleteProjectModalOpen}
        onClose={() => setDeleteProjectModal(false)}
      />
      {/* Join Project Modal */}
      {workspaceSlug && (
        <JoinProjectModal
          workspaceSlug={workspaceSlug.toString()}
          project={project}
          isOpen={joinProjectModalOpen}
          handleClose={() => setJoinProjectModal(false)}
        />
      )}
      {/* Restore project modal */}
      {workspaceSlug && project && (
        <ArchiveRestoreProjectModal
          workspaceSlug={workspaceSlug.toString()}
          projectId={project.id}
          isOpen={restoreProject}
          onClose={() => setRestoreProject(false)}
          archive={false}
        />
      )}
      <Link
        ref={projectCardRef}
        href={`/${workspaceSlug}/projects/${project.id}/issues`}
        onClick={(e) => {
          if (!isMemberOfProject || isArchived) {
            e.preventDefault();
            e.stopPropagation();
            if (!isArchived) setJoinProjectModal(true);
          }
        }}
        data-prevent-progress={!isMemberOfProject || isArchived}
        className="group/project-card flex w-full flex-col justify-between overflow-hidden rounded-lg border border-subtle-1 bg-layer-2 transition-all duration-300 hover:border-strong hover:shadow-raised-200"
      >
        <ContextMenu parentRef={projectCardRef} items={MENU_ITEMS} />
        <div className="relative h-[108px] w-full rounded-t">
          <CoverImage
            src={project.cover_image_url}
            alt={project.name}
            className="absolute top-0 left-0 h-full w-full rounded-t"
          />
          {/* fades the cover into the card surface below it */}
          <div className="absolute inset-0 rounded-t bg-[linear-gradient(180deg,var(--background-color-layer-transparent-selected)_40%,var(--background-color-layer-2)_100%)]" />
          <div className="absolute top-3 left-3 grid size-9 place-items-center rounded-md bg-layer-3">
            <Logo logo={project.logo_props} size={20} />
          </div>
          {(menuItems.length > 0 || showFavorite) && (
            <div
              role="presentation"
              data-prevent-progress
              className={cn(
                "absolute top-3 right-3 z-[1] flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover/project-card:opacity-100 focus-within:opacity-100",
                { "opacity-100": isMenuOpen }
              )}
              {...stopCardNavigation}
            >
              {menuItems.length > 0 && (
                <Menu onOpenChange={setIsMenuOpen}>
                  <MenuTrigger
                    render={
                      <IconButton
                        variant="secondary"
                        size="sm"
                        aria-label={t("aria_labels.common.more_actions")}
                        icon={<Icon icon={MoreHorizontalOutline} />}
                      />
                    }
                  />
                  <MenuContent side="bottom" align="end">
                    {menuItems.map((item) => (
                      <MenuItem
                        key={item.key}
                        variant={resolveItemVariant(item)}
                        icon={item.icon ? <Icon icon={item.icon} /> : undefined}
                        label={item.title ?? ""}
                        onClick={() => item.action()}
                      />
                    ))}
                  </MenuContent>
                </Menu>
              )}
              {showFavorite && (
                <FavoriteStar
                  variant="secondary"
                  onClick={() => {
                    if (project.is_favorite) handleRemoveFromFavorites();
                    else handleAddToFavorites();
                  }}
                  selected={!!project.is_favorite}
                />
              )}
            </div>
          )}
        </div>

        <div className={cn("w-full rounded-b-sm", { "opacity-90": isArchived })}>
          <div className="space-y-4 px-3 pt-1.5 pb-3">
            {/* header */}
            <div className="space-y-1">
              <h3 className="truncate text-body-sm-medium text-primary">{project.name}</h3>
              <div className="flex items-center gap-1.5">
                <p className="text-caption-md-regular text-secondary">{project.identifier}</p>
                {project.network === 0 && <LockOutline className="size-3 shrink-0 text-icon-secondary" />}
              </div>
            </div>
            {/* lead */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <LeadOutline className="size-3.5 shrink-0 text-icon-tertiary" />
                <span className="text-caption-md-regular text-tertiary">
                  {projectLead ? t("lead") : t("workspace_projects.card.no_lead")}
                </span>
              </div>
              {projectLead && (
                <div className="flex min-w-0 items-center gap-1.5">
                  <Avatar
                    src={getFileURL(projectLead.avatar_url)}
                    alt={projectLead.display_name}
                    fallback={projectLead.display_name?.[0]?.toUpperCase()}
                    size="2xs"
                  />
                  <span className="truncate text-caption-md-regular text-secondary">{projectLead.display_name}</span>
                </div>
              )}
            </div>
          </div>
          {/* footer */}
          <div className="flex items-center justify-between gap-2 border-t border-subtle p-3">
            {isArchived ? (
              <Badge variant="neutral" size="sm" label={t("workspace_projects.card.archived")} />
            ) : isMemberOfProject ? (
              <Badge variant="success" size="sm" label={t("workspace_projects.card.joined")} />
            ) : (
              <Button
                variant="secondary"
                size="sm"
                stretch="auto"
                label={t("common.join")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setJoinProjectModal(true);
                }}
              />
            )}
            {projectMembers.length > 0 && (
              <Tooltip label={`${t("members")}: ${projectMembers.length}`} disabled={isMobile}>
                <div className="flex shrink-0 cursor-pointer items-center">
                  <AvatarGroup size="xs" max={3}>
                    {projectMembers.map((member) => (
                      <Avatar
                        key={member.id}
                        alt={member.display_name}
                        fallback={member.display_name?.[0]?.toUpperCase()}
                        src={getFileURL(member.avatar_url)}
                      />
                    ))}
                  </AvatarGroup>
                </div>
              </Tooltip>
            )}
          </div>
        </div>
      </Link>
    </>
  );
});
