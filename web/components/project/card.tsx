import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// icons
import { Globe2, LinkIcon, Lock, Pencil, Star } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Tooltip } from "@plane/ui";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
import { copyTextToClipboard } from "helpers/string.helper";
import { renderEmoji } from "helpers/emoji.helper";
// types
import type { IProject } from "types";
// components
import { DeleteProjectModal, JoinProjectModal } from "components/project";
import { AssigneesList } from "components/ui";

export type ProjectCardProps = {
  project: IProject;
};

export const ProjectCard: React.FC<ProjectCardProps> = observer((props) => {
  const { project } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // toast
  const { setToastAlert } = useToast();
  // states
  const [deleteProjectModalOpen, setDeleteProjectModal] = useState(false);
  const [joinProjectModalOpen, setJoinProjectModal] = useState(false);

  const { project: projectStore }: RootStore = useMobxStore();

  const isOwner = project.member_role === 20;
  const isMember = project.member_role === 15;

  const handleAddToFavorites = () => {
    if (!workspaceSlug) return;

    projectStore.addProjectToFavorites(workspaceSlug.toString(), project.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't remove the project from favorites. Please try again.",
      });
    });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !project) return;

    projectStore.removeProjectFromFavorites(workspaceSlug.toString(), project.id).catch(() => {
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

  const projectMembersIds = project.members.map((member) => member.member_id);

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
      <div className="flex flex-col rounded bg-custom-background-100 shadow-custom-shadow-xs">
        <Link href={`/${workspaceSlug as string}/projects/${project.id}/issues`}>
          <a>
            <div className="relative h-[118px] w-full rounded-t ">
              <div className="absolute z-[1] inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              <img
                src={
                  project.cover_image ??
                  "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                }
                alt={project.name}
                className="absolute top-0 left-0 h-full w-full object-cover rounded-t"
              />

              <div className="absolute h-9 w-full bottom-4 z-10 flex items-center justify-between px-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 flex item-center justify-center rounded bg-white/90 flex-shrink-0">
                    <span className="flex items-center justify-center">
                      {project.emoji
                        ? renderEmoji(project.emoji)
                        : project.icon_prop
                        ? renderEmoji(project.icon_prop)
                        : null}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center h-9">
                    <h3 className="text-sm text-white font-medium line-clamp-1">{project.name}</h3>
                    <span className="flex items-center gap-1.5">
                      <p className="text-xs text-white">
                        Created on {renderShortDateWithYearFormat(project?.created_at)}
                      </p>
                      {project.network === 0 ? (
                        <Lock className="h-3 w-3 text-white" />
                      ) : (
                        <Globe2 className="h-3 w-3 text-white" />
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center h-full gap-2">
                  <button
                    className="flex items-center justify-center h-6 w-6 rounded bg-white/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleCopyText();
                    }}
                  >
                    <LinkIcon className="h-3 w-3 text-white" />
                  </button>
                  <button
                    className="flex items-center justify-center h-6 w-6 rounded bg-white/30"
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
                      className={`h-3 w-3 ${project.is_favorite ? "fill-orange-400 text-transparent" : "text-white"} `}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="h-[104px] w-full flex flex-col justify-between p-4 rounded-b">
              <p className="text-xs text-custom-text-200 break-words line-clamp-2">{project.description}</p>
              <div className="flex item-center justify-between">
                <Tooltip
                  tooltipHeading="Members"
                  tooltipContent={
                    project.members && project.members.length > 0
                      ? project.members.map((member) => member?.member__display_name).join(", ")
                      : "No Assignee"
                  }
                  position="top"
                >
                  <div className="flex items-center cursor-pointer w-full gap-2 text-custom-text-200">
                    <AssigneesList userIds={projectMembersIds} length={3} showLength={true} />
                  </div>
                </Tooltip>
                {(isOwner || isMember) && (
                  <Link href={`/${workspaceSlug}/projects/${project.id}/settings`}>
                    <a className="flex items-center justify-center p-1 text-custom-text-400 hover:bg-custom-background-80 hover:text-custom-text-200 rounded">
                      <Pencil className="h-3.5 w-3.5" />
                    </a>
                  </Link>
                )}

                {!project.is_member ? (
                  <div className="flex items-center">
                    <Button
                      variant="link-primary"
                      className="!p-0"
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
          </a>
        </Link>
      </div>
    </>
  );
});
