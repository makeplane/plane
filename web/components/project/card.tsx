import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter } from "next/router";
import { Globe2, LinkIcon, Lock, Pencil, Star } from "lucide-react";
// ui
import { Avatar, AvatarGroup, Button, Tooltip, TOAST_TYPE, setToast, setPromiseToast } from "@plane/ui";
// components
import { DeleteProjectModal, JoinProjectModal, ProjectLogo } from "components/project";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
import { cn } from "helpers/common.helper";
import { renderFormattedDate } from "helpers/date-time.helper";
// hooks
import { useProject } from "hooks/store";
// types
import type { IProject } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";

type Props = {
  project: IProject;
};

export const ProjectCard: React.FC<Props> = observer((props) => {
  const { project } = props;
  // states
  const [deleteProjectModalOpen, setDeleteProjectModal] = useState(false);
  const [joinProjectModalOpen, setJoinProjectModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { addProjectToFavorites, removeProjectFromFavorites } = useProject();
  // derived values
  const projectMembersIds = project.members?.map((member) => member.member_id);
  // auth
  const isOwner = project.member_role === EUserProjectRoles.ADMIN;
  const isMember = project.member_role === EUserProjectRoles.MEMBER;

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

  const handleCopyText = () =>
    copyUrlToClipboard(`${workspaceSlug}/projects/${project.id}/issues`).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Project link copied to clipboard.",
      })
    );

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
      <div
        onClick={() => {
          if (project.is_member) router.push(`/${workspaceSlug?.toString()}/projects/${project.id}/issues`);
          else setJoinProjectModal(true);
        }}
        className="flex cursor-pointer flex-col rounded bg-custom-background-100 hover:shadow-custom-shadow-4xl transition-all"
      >
        <div className="relative h-16 w-full rounded-t">
          <img
            src={
              project.cover_image ??
              "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
            }
            alt={project.name}
            className="absolute left-0 top-0 h-full w-full rounded-t object-cover"
          />

          <div className="absolute bottom-4 z-10 flex h-10 w-full items-center justify-end gap-3 px-4">
            <div className="h-full flex-shrink-0 flex items-center gap-2">
              <button
                type="button"
                className="h-6 w-6 flex items-center justify-center rounded bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleCopyText();
                }}
              >
                <LinkIcon className="h-3 w-3 text-white" />
              </button>
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded bg-white/10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (project.is_favorite) handleRemoveFromFavorites();
                  else handleAddToFavorites();
                }}
              >
                <Star
                  className={cn("h-3 w-3 text-white", {
                    "fill-amber-400 text-transparent": project.is_favorite,
                  })}
                />
              </button>
            </div>
          </div>

          <div className="absolute left-4 -bottom-5 h-10 w-10 flex-shrink-0 grid place-items-center rounded bg-amber-50">
            <ProjectLogo logo={project.logo_props} />
          </div>
        </div>

        <div className="h-44 w-full flex flex-col justify-between rounded-b border border-custom-border-200 border-t-0">
          <div className="flex flex-col flex-grow gap-3 text-custom-text-200 px-4 pt-10">
            <div className="flex flex-col gap-1">
              <h3 className="truncate font-semibold">{project.name}</h3>
              <span className="flex items-center gap-1 text-custom-text-400 text-sm">
                <span className="text-xs font-medium mr-1">{project.identifier}</span>
                {project.network === 0 ? (
                  <>
                    <Lock className="h-2.5 w-2.5" />
                    Private
                  </>
                ) : (
                  <>
                    <Globe2 className="h-2.5 w-2.5" />
                    Public
                  </>
                )}
              </span>
            </div>
            <p className="line-clamp-2 break-words text-sm text-custom-text-300">
              {project.description && project.description.trim() !== ""
                ? project.description
                : `Created on ${renderFormattedDate(project.created_at)}`}
            </p>
          </div>
          <div className="flex px-4 py-2.5 items-center justify-between border-t-[0.5px] border-custom-border-200">
            <Tooltip
              tooltipHeading="Members"
              tooltipContent={
                project.members && project.members.length > 0 ? `${project.members.length} members` : "No member"
              }
              position="top"
            >
              {projectMembersIds && projectMembersIds.length > 0 ? (
                <div>
                  <AvatarGroup showTooltip={false}>
                    {projectMembersIds.map((memberId) => {
                      const member = project.members?.find((m) => m.member_id === memberId);
                      if (!member) return null;
                      return <Avatar key={member.id} name={member.member__display_name} src={member.member__avatar} />;
                    })}
                  </AvatarGroup>
                </div>
              ) : (
                <span className="text-sm italic text-custom-text-400">No member yet</span>
              )}
            </Tooltip>
            {project.is_member && (isOwner || isMember) && (
              <Link
                href={`/${workspaceSlug}/projects/${project.id}/settings`}
                className="flex items-center justify-center rounded p-1 text-custom-text-400 hover:bg-custom-background-80 hover:text-custom-text-200"
                onClick={(e) => e.stopPropagation()}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            )}
            {!project.is_member && (
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
            )}
          </div>
        </div>
      </div>
    </>
  );
});
