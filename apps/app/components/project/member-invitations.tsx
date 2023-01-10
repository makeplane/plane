// React
import React, { useState } from "react";
// next
import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/router";
// services
import projectService from "lib/services/project.service";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { Button } from "ui";
// icons
import {
  CalendarDaysIcon,
  CheckIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
// types
import type { IProject } from "types";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
// common
import { renderShortNumericDateFormat } from "constants/common";

type TProjectCardProps = {
  workspaceSlug: string;
  project: IProject;
  setToJoinProject: (id: string | null) => void;
  setDeleteProject: (id: string | null) => void;
};

const ProjectMemberInvitations: React.FC<TProjectCardProps> = (props) => {
  const { workspaceSlug, project, setToJoinProject, setDeleteProject } = props;

  const { user } = useUser();
  const router = useRouter();

  const { data: members } = useSWR(PROJECT_MEMBERS(project.id), () =>
    projectService.projectMembers(workspaceSlug, project.id)
  );

  const isMember = members?.some((item: any) => item.member.id === (user as any)?.id);

  const canEdit = members?.some(
    (item) => (item.member.id === (user as any)?.id && item.role === 20) || item.role === 15
  );
  const canDelete = members?.some(
    (item) => item.member.id === (user as any)?.id && item.role === 20
  );

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
          <div className="flex gap-2 text-lg font-medium">
            <Link href={`/${workspaceSlug}/projects/${project.id}/issues`}>
              <a className="flex items-center gap-x-3">
                {project.icon && (
                  <span className="text-base">{String.fromCodePoint(parseInt(project.icon))}</span>
                )}
                <span>{project.name}</span>
                <span className="text-xs text-gray-500">{project.identifier}</span>
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
              <Button theme="secondary" className="flex items-center gap-1" disabled>
                <CheckIcon className="h-3 w-3" />
                Member
              </Button>
            )}
            <Button
              theme="secondary"
              className="flex items-center gap-1"
              onClick={() => router.push(`/${workspaceSlug}/projects/${project.id}/issues`)}
            >
              <ClipboardDocumentListIcon className="h-3 w-3" />
              Open Project
            </Button>
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

export default ProjectMemberInvitations;
