import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArchiveRestoreIcon, Settings, UserPlus } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, IS_FAVORITE_MENU_OPEN } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { LinkIcon, LockIcon, NewTabIcon, TrashIcon, CheckIcon } from "@plane/propel/icons";
import { setPromiseToast, setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { IProject } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { Avatar, AvatarGroup, ContextMenu, FavoriteStar } from "@plane/ui";
import { copyUrlToClipboard, cn, getFileURL, renderFormattedDate } from "@plane/utils";
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

export const ProjectCard = observer(function ProjectCard(props: Props) {
  const { project } = props;
  // states
  const [deleteProjectModalOpen, setDeleteProjectModal] = useState(false);
  const [joinProjectModalOpen, setJoinProjectModal] = useState(false);
  const [restoreProject, setRestoreProject] = useState(false);
  // refs
  const projectCardRef = useRef(null);
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { getUserDetails } = useMember();
  const { addProjectToFavorites, removeProjectFromFavorites } = useProject();
  const { allowPermissions } = useUserPermissions();
  // hooks
  const { isMobile } = usePlatformOS();
  // derived values
  const projectMembersIds = project.members;
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
        actionItems: () => {
          if (!isFavoriteMenuOpen) toggleFavoriteMenu(true);
          return <></>;
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
        type: TOAST_TYPE.INFO,
        title: "Link Copied!",
        message: "Project link copied to clipboard.",
      })
    );
  const handleOpenInNewTab = () => window.open(`/${projectLink}`, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "settings",
      action: () => router.push(`/${workspaceSlug}/settings/projects/${project.id}`),
      title: "Settings",
      icon: Settings,
      shouldRender: !isArchived && (hasAdminRole || hasMemberRole),
    },
    {
      key: "join",
      action: () => setJoinProjectModal(true),
      title: "Join",
      icon: UserPlus,
      shouldRender: !isMemberOfProject && !isArchived,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: "Open in new tab",
      icon: NewTabIcon,
      shouldRender: !isMemberOfProject && !isArchived,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: "Copy link",
      icon: LinkIcon,
      shouldRender: !isArchived,
    },
    {
      key: "restore",
      action: () => setRestoreProject(true),
      title: "Restore",
      icon: ArchiveRestoreIcon,
      shouldRender: isArchived && hasAdminRole,
    },
    {
      key: "delete",
      action: () => setDeleteProjectModal(true),
      title: "Delete",
      icon: TrashIcon,
      shouldRender: isArchived && hasAdminRole,
    },
  ];

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
        className={cn(
          "flex flex-col justify-between group/project-card border border-subtle bg-layer-2 hover:shadow-raised-200 hover:border-strong w-full rounded-lg overflow-hidden duration-300 transition-all"
        )}
      >
        <ContextMenu parentRef={projectCardRef} items={MENU_ITEMS} />
        <div className="relative h-[118px] w-full rounded-t ">
          <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/60 to-transparent" />

          <CoverImage
            src={project.cover_image_url}
            alt={project.name}
            className="absolute left-0 top-0 h-full w-full rounded-t"
          />

          <div className="absolute bottom-4 z-[1] flex h-10 w-full items-center justify-between gap-3 px-4">
            <div className="flex flex-grow items-center gap-2.5 truncate">
              <div className="h-9 w-9 flex-shrink-0 grid place-items-center rounded-sm bg-white/10">
                <Logo logo={project.logo_props} size={18} />
              </div>

              <div className="flex w-full flex-col justify-between gap-0.5 truncate">
                <h3 className="truncate font-semibold text-on-color">{project.name}</h3>
                <span className="flex items-center gap-1.5">
                  <p className="text-11 font-medium text-on-color">{project.identifier} </p>
                  {project.network === 0 && <LockIcon className="h-2.5 w-2.5 text-on-color " />}
                </span>
              </div>
            </div>

            {!isArchived && (
              <div data-prevent-progress className="flex h-full flex-shrink-0 items-center gap-2">
                <button
                  className="flex h-6 w-6 items-center justify-center rounded-sm bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleCopyText();
                  }}
                >
                  <LinkIcon className="h-3 w-3 text-on-color" />
                </button>
                {shouldRenderFavorite && (
                  <FavoriteStar
                    buttonClassName="h-6 w-6 bg-white/10 rounded-sm"
                    iconClassName={cn("h-3 w-3", {
                      "text-on-color": !project.is_favorite,
                    })}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (project.is_favorite) handleRemoveFromFavorites();
                      else handleAddToFavorites();
                    }}
                    selected={!!project.is_favorite}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className={cn("flex h-[104px] w-full flex-col justify-between rounded-b-sm p-4", {
            "opacity-90": isArchived,
          })}
        >
          <p className="line-clamp-2 break-words text-13 text-tertiary">
            {project.description && project.description.trim() !== ""
              ? project.description
              : `Created on ${renderFormattedDate(project.created_at)}`}
          </p>
          <div className="item-center flex justify-between">
            <div className="flex items-center justify-center gap-2">
              <Tooltip
                isMobile={isMobile}
                tooltipHeading="Members"
                tooltipContent={
                  project.members && project.members.length > 0 ? `${project.members.length} Members` : "No Member"
                }
                position="top"
              >
                {projectMembersIds && projectMembersIds.length > 0 ? (
                  <div className="flex cursor-pointer items-center gap-2 text-secondary">
                    <AvatarGroup showTooltip={false}>
                      {projectMembersIds.map((memberId) => {
                        const member = getUserDetails(memberId);
                        if (!member) return null;
                        return (
                          <Avatar key={member.id} name={member.display_name} src={getFileURL(member.avatar_url)} />
                        );
                      })}
                    </AvatarGroup>
                  </div>
                ) : (
                  <span className="text-13 italic text-placeholder">No Member Yet</span>
                )}
              </Tooltip>
              {isArchived && <div className="text-11 text-placeholder font-medium">Archived</div>}
            </div>
            {isArchived ? (
              hasAdminRole && (
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="flex items-center justify-center text-11 text-placeholder font-medium hover:text-secondary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRestoreProject(true);
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <ArchiveRestoreIcon className="h-3.5 w-3.5" />
                      Restore
                    </div>
                  </div>
                  <div
                    className="flex items-center justify-center text-11 text-placeholder font-medium hover:text-secondary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteProjectModal(true);
                    }}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </div>
                </div>
              )
            ) : (
              <>
                {isMemberOfProject &&
                  (hasAdminRole || hasMemberRole ? (
                    <Link
                      className="flex items-center justify-center rounded-sm p-1 text-placeholder hover:bg-layer-1 hover:text-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      href={`/${workspaceSlug}/settings/projects/${project.id}`}
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1 text-placeholder text-13">
                      <CheckIcon className="h-3.5 w-3.5" />
                      Joined
                    </span>
                  ))}
                {!isMemberOfProject && (
                  <div className="flex items-center">
                    <Button
                      variant="link"
                      className="!p-0 font-semibold"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setJoinProjectModal(true);
                      }}
                    >
                      Join
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Link>
    </>
  );
});
