import React, { useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArchiveRestoreIcon, Check, ExternalLink, LinkIcon, Lock, Settings, Trash2, UserPlus } from "lucide-react";
// types
import type { IProject } from "@plane/types";
// ui
import {
  Avatar,
  AvatarGroup,
  Button,
  Tooltip,
  TOAST_TYPE,
  setToast,
  setPromiseToast,
  ContextMenu,
  TContextMenuItem,
} from "@plane/ui";
// components
import { FavoriteStar } from "@/components/core";
import { ArchiveRestoreProjectModal, DeleteProjectModal, JoinProjectModal, ProjectLogo } from "@/components/project";
// constants
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  project: IProject;
};

export const ProjectCard: React.FC<Props> = observer((props) => {
  const { project } = props;
  // states
  const [deleteProjectModalOpen, setDeleteProjectModal] = useState(false);
  const [joinProjectModalOpen, setJoinProjectModal] = useState(false);
  const [restoreProject, setRestoreProject] = useState(false);
  // refs
  const projectCardRef = useRef(null);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { addProjectToFavorites, removeProjectFromFavorites } = useProject();
  // hooks
  const { isMobile } = usePlatformOS();
  project.member_role;
  // derived values
  const projectMembersIds = project.members?.map((member) => member.member_id);
  // auth
  const isOwner = project.member_role === EUserProjectRoles.ADMIN;
  const isMember = project.member_role === EUserProjectRoles.MEMBER;
  // archive
  const isArchived = !!project.archived_at;

  const handleAddToFavorites = () => {
    if (!workspaceSlug) return;

    const addToFavoritePromise = addProjectToFavorites(workspaceSlug.toString(), project.id);
    setPromiseToast(addToFavoritePromise, {
      loading: "Adding project to favorites...",
      success: {
        title: "Success!",
        message: () => "Project added to favorites.",
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
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Project link copied to clipboard.",
      })
    );
  const handleOpenInNewTab = () => window.open(`/${projectLink}`, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "settings",
      action: () => router.push(`/${workspaceSlug}/projects/${project.id}/settings`),
      title: "Settings",
      icon: Settings,
      shouldRender: !isArchived && (isOwner || isMember),
    },
    {
      key: "join",
      action: () => setJoinProjectModal(true),
      title: "Join",
      icon: UserPlus,
      shouldRender: !project.is_member && !isArchived,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: "Open in new tab",
      icon: ExternalLink,
      shouldRender: project.is_member && !isArchived,
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
      shouldRender: isArchived && isOwner,
    },
    {
      key: "delete",
      action: () => setDeleteProjectModal(true),
      title: "Delete",
      icon: Trash2,
      shouldRender: isArchived && isOwner,
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
          if (!project.is_member || isArchived) {
            e.preventDefault();
            e.stopPropagation();
            if (!isArchived) setJoinProjectModal(true);
          }
        }}
        className="flex flex-col rounded border border-custom-border-200 bg-custom-background-100"
      >
        <ContextMenu parentRef={projectCardRef} items={MENU_ITEMS} />
        <div className="relative h-[118px] w-full rounded-t ">
          <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/60 to-transparent" />

          <img
            src={
              project.cover_image ??
              "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
            }
            alt={project.name}
            className="absolute left-0 top-0 h-full w-full rounded-t object-cover"
          />

          <div className="absolute bottom-4 z-[1] flex h-10 w-full items-center justify-between gap-3 px-4">
            <div className="flex flex-grow items-center gap-2.5 truncate">
              <div className="h-9 w-9 flex-shrink-0 grid place-items-center rounded bg-white/90">
                <ProjectLogo logo={project.logo_props} />
              </div>

              <div className="flex w-full flex-col justify-between gap-0.5 truncate">
                <h3 className="truncate font-semibold text-white">{project.name}</h3>
                <span className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-white">{project.identifier} </p>
                  {project.network === 0 && <Lock className="h-2.5 w-2.5 text-white " />}
                </span>
              </div>
            </div>

            {!isArchived && (
              <div className="flex h-full flex-shrink-0 items-center gap-2">
                <button
                  className="flex h-6 w-6 items-center justify-center rounded bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleCopyText();
                  }}
                >
                  <LinkIcon className="h-3 w-3 text-white" />
                </button>
                <FavoriteStar
                  buttonClassName="h-6 w-6 bg-white/10"
                  iconClassName={cn("h-3 w-3", {
                    "text-white": !project.is_favorite,
                  })}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (project.is_favorite) handleRemoveFromFavorites();
                    else handleAddToFavorites();
                  }}
                  selected={project.is_favorite}
                />
              </div>
            )}
          </div>
        </div>

        <div
          className={cn("flex h-[104px] w-full flex-col justify-between rounded-b p-4", {
            "opacity-90": isArchived,
          })}
        >
          <p className="line-clamp-2 break-words text-sm text-custom-text-300">
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
                  <div className="flex cursor-pointer items-center gap-2 text-custom-text-200">
                    <AvatarGroup showTooltip={false}>
                      {projectMembersIds.map((memberId) => {
                        const member = project.members?.find((m) => m.member_id === memberId);
                        if (!member) return null;
                        return (
                          <Avatar key={member.id} name={member.member__display_name} src={member.member__avatar} />
                        );
                      })}
                    </AvatarGroup>
                  </div>
                ) : (
                  <span className="text-sm italic text-custom-text-400">No Member Yet</span>
                )}
              </Tooltip>
              {isArchived && <div className="text-xs text-custom-text-400 font-medium">Archived</div>}
            </div>
            {isArchived ? (
              isOwner && (
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="flex items-center justify-center text-xs text-custom-text-400 font-medium hover:text-custom-text-200"
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
                    className="flex items-center justify-center text-xs text-custom-text-400 font-medium hover:text-custom-text-200"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteProjectModal(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </div>
                </div>
              )
            ) : (
              <>
                {project.is_member &&
                  (isOwner || isMember ? (
                    <Link
                      className="flex items-center justify-center rounded p-1 text-custom-text-400 hover:bg-custom-background-80 hover:text-custom-text-200"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      href={`/${workspaceSlug}/projects/${project.id}/settings`}
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1 text-custom-text-400 text-sm">
                      <Check className="h-3.5 w-3.5" />
                      Joined
                    </span>
                  ))}
                {!project.is_member && (
                  <div className="flex items-center">
                    <Button
                      variant="link-primary"
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
