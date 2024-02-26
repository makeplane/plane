import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { LinkIcon, Lock, Pencil, Star } from "lucide-react";
import Link from "next/link";
// hooks
import { useProject } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { DeleteProjectModal, JoinProjectModal } from "components/project";
// ui
import { Avatar, AvatarGroup, Button, Tooltip } from "@plane/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
import { renderEmoji } from "helpers/emoji.helper";
// types
import type { IProject } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";

export type ProjectCardProps = {
  project: IProject;
};

export const ProjectCard: React.FC<ProjectCardProps> = observer((props) => {
  const { project } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // toast alert
  const { setToastAlert } = useToast();
  // states
  const [deleteProjectModalOpen, setDeleteProjectModal] = useState(false);
  const [joinProjectModalOpen, setJoinProjectModal] = useState(false);
  // store hooks
  const { addProjectToFavorites, removeProjectFromFavorites } = useProject();

  project.member_role;
  const isOwner = project.member_role === EUserProjectRoles.ADMIN;
  const isMember = project.member_role === EUserProjectRoles.MEMBER;

  const handleAddToFavorites = () => {
    if (!workspaceSlug) return;

    addProjectToFavorites(workspaceSlug.toString(), project.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't remove the project from favorites. Please try again.",
      });
    });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !project) return;

    removeProjectFromFavorites(workspaceSlug.toString(), project.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't remove the project from favorites. Please try again.",
      });
    });
  };

  const handleCopyText = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${project.id}/issues`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Project link copied to clipboard.",
      });
    });
  };

  const projectMembersIds = project.members?.map((member) => member.member_id);

  return (
    <>
      {/* Delete Project Modal  */}
      <DeleteProjectModal
        project={project}
        isOpen={deleteProjectModalOpen}
        onClose={() => setDeleteProjectModal(false)}
      />
      {/* Join Project Modal */}
      {workspaceSlug && (
        <JoinProjectModal
          workspaceSlug={workspaceSlug?.toString()}
          project={project}
          isOpen={joinProjectModalOpen}
          handleClose={() => setJoinProjectModal(false)}
        />
      )}

      {/* Card Information */}
      <div
        onClick={() => {
          if (project.is_member) router.push(`/${workspaceSlug?.toString()}/projects/${project.id}/issues`);
          else setJoinProjectModal(true);
        }}
        className="flex cursor-pointer flex-col rounded border border-custom-border-200 bg-custom-background-100"
      >
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

          <div className="absolute bottom-4 z-10 flex h-10 w-full items-center justify-between gap-3 px-4">
            <div className="flex flex-grow items-center gap-2.5 truncate">
              <div className="item-center flex h-9 w-9 flex-shrink-0 justify-center rounded bg-white/90">
                <span className="flex items-center justify-center">
                  {project.emoji
                    ? renderEmoji(project.emoji)
                    : project.icon_prop
                    ? renderEmoji(project.icon_prop)
                    : null}
                </span>
              </div>

              <div className="flex w-full flex-col justify-between gap-0.5 truncate">
                <h3 className="truncate font-semibold text-white">{project.name}</h3>
                <span className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-white">{project.identifier} </p>
                  {project.network === 0 && <Lock className="h-2.5 w-2.5 text-white " />}
                </span>
              </div>
            </div>

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
              <button
                className="flex h-6 w-6 items-center justify-center rounded bg-white/10"
                onClick={(e) => {
                  if (project.is_favorite) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveFromFavorites();
                  } else {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToFavorites();
                  }
                }}
              >
                <Star
                  className={`h-3 w-3 ${project.is_favorite ? "fill-amber-400 text-transparent" : "text-white"} `}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[104px] w-full flex-col justify-between rounded-b p-4">
          <p className="line-clamp-2 break-words text-sm text-custom-text-300">{project.description}</p>
          <div className="item-center flex justify-between">
            <Tooltip
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

                      return <Avatar key={member.id} name={member.member__display_name} src={member.member__avatar} />;
                    })}
                  </AvatarGroup>
                </div>
              ) : (
                <span className="text-sm italic text-custom-text-400">No Member Yet</span>
              )}
            </Tooltip>
            {(isOwner || isMember) && (
              <Link
                className="flex items-center justify-center rounded p-1 text-custom-text-400 hover:bg-custom-background-80 hover:text-custom-text-200"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                href={`/${workspaceSlug}/projects/${project.id}/settings`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            )}

            {!project.is_member ? (
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
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
});
