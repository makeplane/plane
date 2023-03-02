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
import { UserGroupIcon, MagnifyingGlassIcon, CheckIcon } from "@heroicons/react/24/outline";

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
          <Combobox.Button
            className={({ open }) =>
              `flex items-center text-xs cursor-pointer border rounded-md shadow-sm duration-300 
              ${
                open
                  ? "outline-none border-[#3F76FF] bg-[rgba(63,118,255,0.05)] ring-1 ring-[#3F76FF] "
                  : "hover:bg-[rgba(63,118,255,0.05)] focus:bg-[rgba(63,118,255,0.05)]"
              }`
            }
          >
            <span className="flex justify-center items-center text-xs">
              {value && value.length > 0 && Array.isArray(value) ? (
                <span className="flex items-center justify-center gap-2 px-3 py-1">
                  <AssigneesList userIds={value} length={3} showLength={false} />
                  <span className=" text-[#495057]">{value.length} Assignees</span>
                </span>
              ) : (
                <span className="flex items-center justify-center  gap-2  px-3 py-1.5">
                  <UserGroupIcon className="h-4 w-4 text-gray-500 " />
                  <span className=" text-[#858E96]">Assignee</span>
                </span>
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
              className={`absolute z-10 max-h-52 min-w-[8rem] mt-1 px-2 py-2  
              text-xs rounded-md shadow-md overflow-auto border-none bg-white 
              ring-1 ring-black ring-opacity-5 focus:outline-none`}
            >
              <div className="flex justify-start items-center rounded-sm border-[0.6px] bg-[#FAFAFA] border-[#E2E2E2] w-full px-2">
                <MagnifyingGlassIcon className="h-3 w-3 text-gray-500" />
                <Combobox.Input
                  className="w-full  bg-transparent py-1 px-2 text-xs text-[#888888] focus:outline-none"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search for a person..."
                  displayValue={(assigned: any) => assigned?.name}
                />
              </div>
              <div className="py-1.5">
                {filteredOptions ? (
                  filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <Combobox.Option
                        key={option.value}
                        className={({ active }) =>
                          `${
                            active ? "bg-[#E9ECEF]" : ""
                          } group flex min-w-[14rem] cursor-pointer select-none items-center gap-2 truncate rounded px-1 py-1.5 text-[#495057]`
                        }
                        value={option.value}
                      >
                        {({ selected, active }) => (
                          <div className="flex w-full gap-2 justify-between rounded">
                            <div className="flex justify-start items-center gap-1">
                              <Avatar
                                user={people?.find((p) => p.member.id === option.value)?.member}
                              />
                              <span>{option.display}</span>
                            </div>
                            <div
                              className={`flex justify-center items-center p-1 rounded border  border-[#858E96] border-opacity-0 group-hover:border-opacity-100 
                              ${selected ? "border-opacity-100 " : ""}  
                              ${active ? "bg-[#F8F9FA]" : ""} `}
                            >
                              <CheckIcon
                                className={`h-3 w-3 ${selected ? "opacity-100" : "opacity-0"}`}
                              />
                            </div>
                          </div>
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
