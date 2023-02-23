import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Listbox, Transition } from "@headlessui/react";
// services
import projectService from "services/project.service";
// ui
import { AssigneesList, Avatar, Tooltip } from "components/ui";
// types
import { IIssue } from "types";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>) => void;
  tooltipPosition?: "left" | "right";
  position?: "left" | "right";
  isNotAllowed: boolean;
};

export const ViewAssigneeSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  tooltipPosition = "right",
  position = "right",
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: members } = useSWR(
    projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  return (
    <Listbox
      as="div"
      value={issue.assignees}
      onChange={(data: any) => {
        const newData = issue.assignees ?? [];

        if (newData.includes(data)) newData.splice(newData.indexOf(data), 1);
        else newData.push(data);

        partialUpdateIssue({ assignees_list: newData });
      }}
      className="group relative flex-shrink-0"
      disabled={isNotAllowed}
    >
      {({ open }) => (
        <div>
          <Listbox.Button>
            <Tooltip
              position={`top-${tooltipPosition}`}
              tooltipHeading="Assignees"
              tooltipContent={
                issue.assignee_details.length > 0
                  ? issue.assignee_details
                      .map((assignee) =>
                        assignee?.first_name !== "" ? assignee?.first_name : assignee?.email
                      )
                      .join(", ")
                  : "No Assignee"
              }
            >
              <div
                className={`flex ${
                  isNotAllowed ? "cursor-not-allowed" : "cursor-pointer"
                } items-center gap-1 text-xs`}
              >
                <AssigneesList userIds={issue.assignees ?? []} />
              </div>
            </Tooltip>
          </Listbox.Button>

          <Transition
            show={open}
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              className={`absolute z-10 mt-1 max-h-48 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
                position === "left" ? "left-0" : "right-0"
              }`}
            >
              {members?.map((member) => (
                <Listbox.Option
                  key={member.member.id}
                  className={({ active, selected }) =>
                    `flex items-center gap-x-1 cursor-pointer select-none p-2 whitespace-nowrap ${
                      active ? "bg-indigo-50" : ""
                    } ${
                      selected || issue.assignees?.includes(member.member.id)
                        ? "bg-indigo-50 font-medium"
                        : "font-normal"
                    }`
                  }
                  value={member.member.id}
                >
                  <Avatar user={member.member} />
                  {member.member.first_name && member.member.first_name !== ""
                    ? member.member.first_name
                    : member.member.email}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
};
