import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
// ui
// icons
import {
  CalendarDaysIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
// types
// ui
import { Button } from "components/ui";
// hooks
import useProjectMembers from "hooks/use-project-members";
// helpers
import { renderShortNumericDateFormat } from "helpers/date-time.helper";
// types
import type { IProject } from "types";

export type ProjectCardProps = {
  workspaceSlug: string;
  project: IProject;
  setToJoinProject: (id: string | null) => void;
  setDeleteProject: (id: string | null) => void;
};

export const ProjectCard: React.FC<ProjectCardProps> = (props) => {
  const { workspaceSlug, project, setToJoinProject, setDeleteProject } = props;
  // router
  const router = useRouter();
  // fetching project members information
  const { members, isMember, canDelete, canEdit } = useProjectMembers(workspaceSlug, project.id);

  if (!members) {
    return (
      <div className="flex h-36 w-full flex-col rounded-md bg-white px-4 py-3">
        <div className="h-full w-full animate-pulse bg-gray-50" />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full flex-col rounded-md border bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2  text-lg font-medium">
            <Link href={`/${workspaceSlug}/projects/${project.id}/issues`}>
              <a className="flex items-center gap-x-3">
                {project.icon && (
                  <span className="text-base">{String.fromCodePoint(parseInt(project.icon))}</span>
                )}
                <span className=" max-w-[225px] w-[125px] xl:max-w-[225px] text-ellipsis overflow-hidden">
                  {project.name}
                </span>
                <span className="text-xs text-gray-500 ">{project.identifier}</span>
              </a>
            </Link>
          </div>
          {isMember ? (
            <div className="flex">
              {canEdit && (
                <Link href={`/${workspaceSlug}/projects/${project.id}/settings`}>
                  <a className="grid h-7 w-7 cursor-pointer place-items-center rounded p-1 duration-300 hover:bg-gray-100">
                    <PencilIcon className="h-4 w-4" />
                  </a>
                </Link>
              )}
              {canDelete && (
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-100"
                  onClick={() => setDeleteProject(project.id)}
                >
                  <TrashIcon className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>
          ) : null}
        </div>
        <div className="mt-2">
          <p className="text-sm">{project.description}</p>
        </div>
        <div className="mt-3 flex h-full items-end justify-between">
          <div className="flex gap-2">
            <Button
              theme="secondary"
              className="flex items-center gap-1"
              onClick={() => router.push(`/${workspaceSlug}/projects/${project.id}/issues`)}
            >
              <ClipboardDocumentListIcon className="h-3 w-3" />
              Open Project
            </Button>
            {!isMember ? (
              <button
                type="button"
                onClick={() => {
                  setToJoinProject(project.id);
                }}
                className="flex cursor-pointer items-center gap-1 rounded border p-2 text-xs font-medium duration-300 hover:bg-gray-100"
              >
                <PlusIcon className="h-3 w-3" />
                <span>Select to Join</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 text-xs">
                <CheckIcon className="h-3 w-3" />
                Member
              </div>
            )}
          </div>
          <div className="mb-1 flex items-center gap-1 text-xs">
            <CalendarDaysIcon className="h-4 w-4" />
            {renderShortNumericDateFormat(project.created_at)}
          </div>
        </div>
      </div>
    </>
  );
};
