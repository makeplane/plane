// React
import React, { useState } from "react";
// next
import Link from "next/link";
import useSWR from "swr";
// hooks
import useUser from "lib/hooks/useUser";
// Services
import projectService from "lib/services/project.service";
// fetch keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
// commons
import { renderShortNumericDateFormat } from "constants/common";
// icons
import {
  CalendarDaysIcon,
  CheckIcon,
  EyeIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
// types
import type { IProject } from "types";
type Props = {
  project: IProject;
  slug: string;
  invitationsRespond: string[];
  handleInvitation: (project_invitation: any, action: "accepted" | "withdraw") => void;
  setDeleteProject: React.Dispatch<React.SetStateAction<IProject | undefined>>;
};

const ProjectMemberInvitations: React.FC<Props> = ({
  project,
  slug,
  invitationsRespond,
  handleInvitation,
  setDeleteProject,
}) => {
  const { user } = useUser();

  const { data: members } = useSWR<any[]>(PROJECT_MEMBERS(project.id), () =>
    projectService.projectMembers(slug, project.id)
  );

  const isMember = members?.some((item: any) => item.member.id === (user as any)?.id);

  const [selected, setSelected] = useState<any>(false);

  if (!members) {
    return (
      <div className="w-full h-36 flex flex-col px-4 py-3 rounded-md bg-white">
        <div className="w-full h-full bg-gray-50 animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div
        className={`w-full h-full flex flex-col px-4 py-3 rounded-md bg-white ${
          selected ? "ring-2 ring-indigo-400" : ""
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="font-medium text-lg flex gap-2">
            {!isMember ? (
              <input
                id={project.id}
                className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-2 hidden"
                aria-describedby="workspaces"
                name={project.id}
                checked={invitationsRespond.includes(project.id)}
                value={project.name}
                onChange={(e) => {
                  setSelected(e.target.checked);
                  handleInvitation(
                    project,
                    invitationsRespond.includes(project.id) ? "withdraw" : "accepted"
                  );
                }}
                type="checkbox"
              />
            ) : null}
            <Link href={`/projects/${project.id}/issues`}>
              <a className="flex flex-col">
                {project.name}
                <span className="text-xs">({project.identifier})</span>
              </a>
            </Link>
          </div>
          {isMember ? (
            <div className="flex">
              <Link href={`/projects/${project.id}/settings`}>
                <a className="h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-200 duration-300 cursor-pointer">
                  <PencilIcon className="h-4 w-4" />
                </a>
              </Link>
              <button
                type="button"
                className="h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-200 duration-300 outline-none"
                onClick={() => setDeleteProject(project)}
              >
                <TrashIcon className="h-4 w-4 text-red-500" />
              </button>
            </div>
          ) : null}
        </div>
        <div className="mt-2">
          <p className="text-sm">{project.description}</p>
        </div>
        <div className="mt-3 h-full flex justify-between items-end">
          <div className="flex gap-2">
            {!isMember ? (
              <label
                htmlFor={project.id}
                className="flex items-center gap-1 text-xs font-medium bg-blue-200 hover:bg-blue-300 p-2 rounded duration-300 cursor-pointer"
              >
                {selected ? (
                  <>
                    <MinusIcon className="h-3 w-3" />
                    Remove
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-3 w-3" />
                    Select to Join
                  </>
                )}
              </label>
            ) : (
              <span className="flex items-center gap-1 text-xs bg-green-200 p-2 rounded">
                <CheckIcon className="h-3 w-3" />
                Member
              </span>
            )}
            <Link href={`/projects/${project.id}/issues`}>
              <a className="flex items-center gap-1 text-xs font-medium bg-blue-200 hover:bg-blue-300 p-2 rounded duration-300">
                <EyeIcon className="h-3 w-3" />
                View
              </a>
            </Link>
          </div>
          <div className="flex items-center gap-1 text-xs mb-1">
            <CalendarDaysIcon className="h-4 w-4" />
            {renderShortNumericDateFormat(project.created_at)}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectMemberInvitations;
