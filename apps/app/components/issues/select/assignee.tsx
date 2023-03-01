import { useState, FC, Fragment } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Transition, Combobox } from "@headlessui/react";
// services
import projectServices from "services/project.service";
// ui
import { AssigneesList, Avatar } from "components/ui";
// icons
import { UserGroupIcon } from "@heroicons/react/24/outline";

// fetch keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

export type IssueAssigneeSelectProps = {
  projectId: string;
  value: string[];
  onChange: (value: string[]) => void;
};

export const IssueAssigneeSelect: FC<IssueAssigneeSelectProps> = ({
  projectId,
  value = [],
  onChange,
}) => {
  // states
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug } = router.query;

  // fetching project members
  const { data: people } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectServices.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options = people?.map((person) => ({
    value: person.member.id,
    display:
      person.member.first_name && person.member.first_name !== ""
        ? person.member.first_name
        : person.member.email,
  }));

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.display.toLowerCase().includes(query.toLowerCase()));

  return (
    <Combobox
      as="div"
      value={value}
      onChange={(val) => onChange(val)}
      className="relative flex-shrink-0"
      multiple
    >
      {({ open }: any) => (
        <>
          <Combobox.Button className="flex items-center cursor-pointer gap-1 rounded-md border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <span className="flex items-center gap-1 text-xs">
              {value && value.length > 0 && Array.isArray(value) ? (
                <>
                  <AssigneesList userIds={value} length={3} showTotalLength />
                  <span>Assignees</span>
                </>
              ) : (
                <>
                  <UserGroupIcon className="h-3 w-3 text-gray-500" />
                  <span>Assignee</span>
                </>
              )}
            </span>
          </Combobox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Combobox.Options
              className={`absolute z-10 mt-1 max-h-32 min-w-[8rem] overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-xs`}
            >
              <Combobox.Input
                className="w-full border-b bg-transparent p-2 text-xs focus:outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                displayValue={(assigned: any) => assigned?.name}
              />
              <div className="py-1">
                {filteredOptions ? (
                  filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <Combobox.Option
                        key={option.value}
                        className={({ active, selected }) =>
                          `${active ? "bg-indigo-50" : ""} ${
                            selected ? "bg-indigo-50 font-medium" : ""
                          } flex cursor-pointer select-none items-center gap-2 truncate px-2 py-1 text-gray-900`
                        }
                        value={option.value}
                      >
                        {people && (
                          <>
                            <Avatar
                              user={people?.find((p) => p.member.id === option.value)?.member}
                            />
                            {option.display}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 px-2">No assignees found</p>
                  )
                ) : (
                  <p className="text-xs text-gray-500 px-2">Loading...</p>
                )}
              </div>
            </Combobox.Options>
          </Transition>
        </>
      )}
    </Combobox>
  );
};
