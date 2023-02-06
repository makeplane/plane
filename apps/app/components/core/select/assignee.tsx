import React from "react";

// headless ui
import { Listbox, Transition } from "@headlessui/react";
// ui
import { AssigneesList, Avatar } from "components/ui";
// types
import { IIssue, IProjectMember } from "types";

type Props = {
  issue: IIssue;
  members: IProjectMember[] | undefined;
  partialUpdateIssue: (formData: Partial<IIssue>) => void;
  isNotAllowed: boolean;
};

export const AssigneeSelect: React.FC<Props> = ({
  issue,
  members,
  partialUpdateIssue,
  isNotAllowed,
}) => (
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
      <>
        <div>
          <Listbox.Button>
            <div
              className={`flex ${
                isNotAllowed ? "cursor-not-allowed" : "cursor-pointer"
              } items-center gap-1 text-xs`}
            >
              <AssigneesList userIds={issue.assignees ?? []} />
            </div>
          </Listbox.Button>

          <Transition
            show={open}
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-48 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {members?.map((member) => (
                <Listbox.Option
                  key={member.member.id}
                  className={({ active, selected }) =>
                    `flex items-center gap-x-1 cursor-pointer select-none p-2 ${
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
                  <p>
                    {member.member.first_name && member.member.first_name !== ""
                      ? member.member.first_name
                      : member.member.email}
                  </p>
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
        <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
          <h5 className="mb-1 font-medium">Assigned to</h5>
          <div>
            {issue.assignee_details?.length > 0
              ? issue.assignee_details.map((assignee) => assignee.first_name).join(", ")
              : "No one"}
          </div>
        </div>
      </>
    )}
  </Listbox>
);
