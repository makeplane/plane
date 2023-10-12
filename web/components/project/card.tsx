import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// icons
import { CalendarDays, Link2Icon, Pencil, Plus, Star, Trash2 } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Tooltip } from "@plane/ui";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
import { renderEmoji } from "helpers/emoji.helper";
// types
import type { IProject } from "types";
// components
import { DeleteProjectModal, JoinProjectModal } from "components/project";

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

  return (
    <>
      {/* Delete Project Modal  */}
      <DeleteProjectModal
        project={project}
        isOpen={deleteProjectModalOpen}
        onClose={() => setDeleteProjectModal(false)}
      />
      {workspaceSlug && (
        <JoinProjectModal
          workspaceSlug={workspaceSlug?.toString()}
          project={project}
          isOpen={joinProjectModalOpen}
          handleClose={() => setJoinProjectModal(false)}
        />
      )}

      {/* Card Information */}
      <div className="flex flex-col rounded-[10px] bg-custom-background-90 shadow">
        <Link href={`/${workspaceSlug as string}/projects/${project.id}/issues`}>
          <a>
            <div className="relative h-32 w-full rounded-t-[10px]">
              <img
                src={
                  project.cover_image ??
                  "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                }
                alt={project.name}
                className="absolute top-0 left-0 h-full w-full object-cover rounded-t-[10px]"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-3 text-white">
                {!project.is_member ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setJoinProjectModal(true);
                    }}
                    className="flex cursor-pointer items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs"
                  >
                    <Plus height={12} width={12} />
                    <span>Select to Join</span>
                  </button>
                ) : (
                  <span className="cursor-default rounded bg-green-600 px-2 py-1 text-xs">Joined</span>
                )}
              </div>

              <div className="absolute top-4 right-4 bg-slate-300 rounded z-10">
                <button
                  className="grid h-6 w-9 place-items-center cursor-pointer"
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
                  <Star className={`h-3.5 w-3.5 ${project.is_favorite ? "text-orange-400" : ""} `} />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 bg-slate-300 rounded-md">
                {project.emoji ? (
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                    {renderEmoji(project.emoji)}
                  </span>
                ) : project.icon_prop ? (
                  renderEmoji(project.icon_prop)
                ) : null}
              </div>
            </div>
          </a>
        </Link>
        <div className="flex h-full flex-col rounded-b-[10px] p-4 text-custom-text-200">
          <Link href={`/${workspaceSlug as string}/projects/${project.id}/issues`}>
            <a>
              <div className="flex items-center gap-1">
                <h3 className="text-1.5xl font-medium text-custom-text-100">{project.name}</h3>
              </div>
              <p className="mt-3.5 mb-7 break-words">{truncateText(project.description ?? "", 100)}</p>
            </a>
          </Link>
          <div className="flex h-full items-end justify-between">
            <Tooltip
              tooltipContent={`Created at ${renderShortDateWithYearFormat(project.created_at)}`}
              position="bottom"
            >
              <div className="flex cursor-default items-center gap-1.5 text-xs">
                <CalendarDays height={14} width={14} />
                {renderShortDateWithYearFormat(project.created_at)}
              </div>
            </Tooltip>
            {project.is_member ? (
              <div className="flex items-center gap-1">
                <div className="flex items-center justify-center p-1 hover:bg-custom-background-80 rounded">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleCopyText();
                    }}
                  >
                    <Link2Icon height={16} width={16} className="-rotate-45" />
                  </button>
                </div>
                {(isOwner || isMember) && (
                  <Link href={`/${workspaceSlug}/projects/${project.id}/settings`}>
                    <a className="flex items-center justify-center p-1 hover:bg-custom-background-80 rounded">
                      <Pencil height={16} width={16} />
                    </a>
                  </Link>
                )}
                {isOwner && (
                  <div className="flex items-center justify-center p-1 hover:bg-custom-background-80 rounded">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setDeleteProjectModal(true);
                      }}
                    >
                      <Trash2 height={16} width={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
});
