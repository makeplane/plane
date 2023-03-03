import React from "react";

import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";

import { mutate } from "swr";

// services
import projectService from "services/project.service";
// hooks
import useProjectMembers from "hooks/use-project-members";
import useToast from "hooks/use-toast";
// ui
import { CustomMenu, Loader, Tooltip } from "components/ui";
// icons
import { CalendarDaysIcon, PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/20/solid";
// helpers
import { renderShortNumericDateFormat } from "helpers/date-time.helper";
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
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

  const handleAddToFavourites = () => {
    if (!workspaceSlug) return;

    projectService
      .addProjectToFavourites(workspaceSlug as string, {
        project: project.id,
      })
      .then(() => {
        mutate<IProject[]>(
          PROJECTS_LIST(workspaceSlug as string),
          (prevData) =>
            (prevData ?? []).map((p) => ({
              ...p,
              is_favourite: p.id === project.id ? true : p.is_favourite,
            })),
          false
        );

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Successfully added the project to favourites.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the project from favourites. Please try again.",
        });
      });
  };

  const handleRemoveFromFavourites = () => {
    if (!workspaceSlug || !project) return;

    projectService
      .removeProjectFromFavourites(workspaceSlug as string, project.id)
      .then(() => {
        mutate<IProject[]>(
          PROJECTS_LIST(workspaceSlug as string),
          (prevData) =>
            (prevData ?? []).map((p) => ({
              ...p,
              is_favourite: p.id === project.id ? false : p.is_favourite,
            })),
          false
        );

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Successfully removed the project from favourites.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the project from favourites. Please try again.",
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
        <div className="flex flex-col shadow rounded-[10px]">
          <Link href={`/${workspaceSlug as string}/projects/${project.id}/issues`}>
            <a>
              <div className="relative h-32 w-full rounded-t-[10px]">
                <Image
                  src={
                    project.cover_image ??
                    "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                  }
                  alt={project.name}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-t-[10px]"
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
                      className="flex cursor-pointer items-center gap-1 bg-green-600 px-2 py-1 rounded text-xs"
                    >
                      <PlusIcon className="h-3 w-3" />
                      <span>Select to Join</span>
                    </button>
                  ) : (
                    <span className="bg-green-600 px-2 py-1 rounded text-xs">Member</span>
                  )}
                  {project.is_favourite && (
                    <span className="bg-orange-400 h-6 w-9 grid place-items-center rounded">
                      <StarIcon className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            </a>
          </Link>
          <div className="flex flex-col px-7 py-4 rounded-b-[10px] h-full">
            <Link href={`/${workspaceSlug as string}/projects/${project.id}/issues`}>
              <a>
                <div className="flex items-center gap-1">
                  <h3 className="text-1.5xl font-semibold">{project.name}</h3>
                  {project.icon && (
                    <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                      {String.fromCodePoint(parseInt(project.icon))}
                    </span>
                  )}
                </div>
                <p className="mt-3.5 mb-7">{truncateText(project.description ?? "", 100)}</p>
              </a>
            </Link>
            <div className="flex justify-between items-end h-full">
              <Tooltip
                tooltipContent={`Created at ${renderShortNumericDateFormat(project.created_at)}`}
                position="bottom"
                theme="dark"
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <CalendarDaysIcon className="h-4 w-4" />
                  {renderShortNumericDateFormat(project.created_at)}
                </div>
              </Tooltip>
              {hasJoined ? (
                <div className="flex items-center">
                  {(isOwner || isMember) && (
                    <Link href={`/${workspaceSlug}/projects/${project.id}/settings`}>
                      <a className="grid cursor-pointer place-items-center rounded p-1 duration-300 hover:bg-gray-100">
                        <PencilIcon className="h-4 w-4" />
                      </a>
                    </Link>
                  )}
                  <CustomMenu width="auto" verticalEllipsis>
                    {isOwner && (
                      <CustomMenu.MenuItem onClick={() => setDeleteProject(project.id)}>
                        Delete project
                      </CustomMenu.MenuItem>
                    )}
                    {project.is_favourite ? (
                      <CustomMenu.MenuItem onClick={handleRemoveFromFavourites}>
                        Remove from favourites
                      </CustomMenu.MenuItem>
                    ) : (
                      <CustomMenu.MenuItem onClick={handleAddToFavourites}>
                        Add to favourites
                      </CustomMenu.MenuItem>
                    )}
                    <CustomMenu.MenuItem onClick={handleCopyText}>
                      Copy project link
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
