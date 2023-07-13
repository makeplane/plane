import React from "react";

import { useRouter } from "next/router";
import Link from "next/link";

import { mutate } from "swr";

// services
import projectService from "services/project.service";
// hooks
import useProjectMembers from "hooks/use-project-members";
import useToast from "hooks/use-toast";
// ui
import { CustomMenu, Loader, Tooltip } from "components/ui";
// icons
import {
  CalendarDaysIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
import { renderEmoji } from "helpers/emoji.helper";
// types
import type { IProject } from "types";
// fetch-keys
import { PROJECTS_LIST } from "constants/fetch-keys";

export type ProjectCardProps = {
  project: IProject;
  setToJoinProject: (id: string | null) => void;
  setDeleteProject: (id: string | null) => void;
};

export const SingleProjectCard: React.FC<ProjectCardProps> = ({
  project,
  setToJoinProject,
  setDeleteProject,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  // fetching project members information
  const { members, hasJoined, isOwner, isMember } = useProjectMembers(
    workspaceSlug as string,
    project.id
  );

  const handleAddToFavorites = () => {
    if (!workspaceSlug) return;

    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug as string, { is_favorite: true }),
      (prevData) => [...(prevData ?? []), { ...project, is_favorite: true }],
      false
    );
    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug as string, { is_favorite: "all" }),
      (prevData) =>
        (prevData ?? []).map((p) => (p.id === project.id ? { ...p, is_favorite: true } : p)),
      false
    );

    projectService
      .addProjectToFavorites(workspaceSlug as string, {
        project: project.id,
      })
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Successfully added the project to favorites.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the project from favorites. Please try again.",
        });
      });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !project) return;

    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug as string, { is_favorite: true }),
      (prevData) => (prevData ?? []).filter((p) => p.id !== project.id),
      false
    );
    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug as string, { is_favorite: "all" }),
      (prevData) =>
        (prevData ?? []).map((p) => (p.id === project.id ? { ...p, is_favorite: false } : p)),
      false
    );

    projectService
      .removeProjectFromFavorites(workspaceSlug as string, project.id)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Successfully removed the project from favorites.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the project from favorites. Please try again.",
        });
      });
  };

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

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
      {members ? (
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
                <div className="absolute left-7 bottom-4 flex items-center gap-3 text-white">
                  {!hasJoined ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setToJoinProject(project.id);
                      }}
                      className="flex cursor-pointer items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs"
                    >
                      <PlusIcon className="h-3 w-3" />
                      <span>Select to Join</span>
                    </button>
                  ) : (
                    <span className="cursor-default rounded bg-green-600 px-2 py-1 text-xs">
                      Member
                    </span>
                  )}
                  {project.is_favorite && (
                    <span className="grid h-6 w-9 cursor-default place-items-center rounded bg-orange-400">
                      <StarIcon className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            </a>
          </Link>
          <div className="flex h-full flex-col rounded-b-[10px] p-4 text-custom-text-200">
            <Link href={`/${workspaceSlug as string}/projects/${project.id}/issues`}>
              <a>
                <div className="flex items-center gap-1">
                  <h3 className="text-1.5xl font-medium text-custom-text-100">{project.name}</h3>
                  {project.emoji ? (
                    <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                      {renderEmoji(project.emoji)}
                    </span>
                  ) : project.icon_prop ? (
                    <span
                      style={{ color: project.icon_prop.color }}
                      className="material-symbols-rounded text-lg"
                    >
                      {project.icon_prop.name}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3.5 mb-7 break-words">
                  {truncateText(project.description ?? "", 100)}
                </p>
              </a>
            </Link>
            <div className="flex h-full items-end justify-between">
              <Tooltip
                tooltipContent={`Created at ${renderShortDateWithYearFormat(project.created_at)}`}
                position="bottom"
                theme="dark"
              >
                <div className="flex cursor-default items-center gap-1.5 text-xs">
                  <CalendarDaysIcon className="h-4 w-4" />
                  {renderShortDateWithYearFormat(project.created_at)}
                </div>
              </Tooltip>
              {hasJoined ? (
                <div className="flex items-center">
                  {(isOwner || isMember) && (
                    <Link href={`/${workspaceSlug}/projects/${project.id}/settings`}>
                      <a className="grid cursor-pointer place-items-center rounded p-1 duration-300 hover:bg-custom-background-90">
                        <PencilIcon className="h-4 w-4" />
                      </a>
                    </Link>
                  )}
                  <CustomMenu width="auto" verticalEllipsis>
                    {isOwner && (
                      <CustomMenu.MenuItem onClick={() => setDeleteProject(project.id)}>
                        <span className="flex items-center justify-start gap-2">
                          <TrashIcon className="h-4 w-4" />
                          <span>Delete project</span>
                        </span>
                      </CustomMenu.MenuItem>
                    )}
                    {project.is_favorite ? (
                      <CustomMenu.MenuItem onClick={handleRemoveFromFavorites}>
                        <span className="flex items-center justify-start gap-2">
                          <StarIcon className="h-4 w-4" />
                          <span>Remove from favorites</span>
                        </span>
                      </CustomMenu.MenuItem>
                    ) : (
                      <CustomMenu.MenuItem onClick={handleAddToFavorites}>
                        <span className="flex items-center justify-start gap-2">
                          <StarIcon className="h-4 w-4" />
                          <span>Add to favorites</span>
                        </span>
                      </CustomMenu.MenuItem>
                    )}
                    <CustomMenu.MenuItem onClick={handleCopyText}>
                      <span className="flex items-center justify-start gap-2">
                        <LinkIcon className="h-4 w-4" />
                        <span>Copy project link</span>
                      </span>
                    </CustomMenu.MenuItem>
                  </CustomMenu>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <Loader>
          <Loader.Item height="144px" />
        </Loader>
      )}
    </>
  );
};
