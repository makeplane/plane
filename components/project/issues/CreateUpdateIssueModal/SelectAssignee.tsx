import React, { useContext } from "react";
// swr
import useSWR from "swr";
// react hook form
import { Controller } from "react-hook-form";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// service
import projectServices from "lib/services/project.service";
// hooks
import useUser from "lib/hooks/useUser";
// fetch keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
// icons
import { CheckIcon } from "@heroicons/react/20/solid";

// types
import type { Control } from "react-hook-form";
import type { IIssue, WorkspaceMember } from "types";
import { UserIcon } from "@heroicons/react/24/outline";

type Props = {
  control: Control<IIssue, any>;
};

const SelectAssignee: React.FC<Props> = ({ control }) => {
  const { activeWorkspace, activeProject } = useUser();

  const { data: people } = useSWR<WorkspaceMember[]>(
    activeWorkspace && activeProject ? PROJECT_MEMBERS(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => projectServices.projectMembers(activeWorkspace.slug, activeProject.id)
      : null
  );

  return (
    <Controller
      control={control}
      name="assignees_list"
      render={({ field: { value, onChange } }) => (
        <Listbox
          value={value}
          onChange={(data: any) => {
            const valueCopy = [...(value ?? [])];
            if (valueCopy.some((i) => i === data)) onChange(valueCopy.filter((i) => i !== data));
            else onChange([...valueCopy, data]);
          }}
        >
          {({ open }) => (
            <>
              <div className="relative">
                <Listbox.Button className="flex items-center gap-1 hover:bg-gray-100 relative border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm duration-300">
                  <UserIcon className="h-3 w-3" />
                  <span className="block truncate">
                    {value && value.length > 0
                      ? value
                          .map(
                            (id) =>
                              people
                                ?.find((i) => i.member.id === id)
                                ?.member.email.substring(0, 4) + "..."
                          )
                          .join(", ")
                      : "Assignees"}
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={React.Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                    <div className="p-1">
                      {people?.map((person) => (
                        <Listbox.Option
                          key={person.member.id}
                          className={({ active }) =>
                            `${
                              active ? "text-white bg-theme" : "text-gray-900"
                            } cursor-pointer select-none relative p-2 rounded-md`
                          }
                          value={person.member.id}
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={`${
                                  selected || (value ?? []).some((i) => i === person.member.id)
                                    ? "font-semibold"
                                    : "font-normal"
                                } block truncate`}
                              >
                                {person.member.email}
                              </span>

                              {selected ? (
                                <span
                                  className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                    active || (value ?? []).some((i) => i === person.member.id)
                                      ? "text-white"
                                      : "text-indigo-600"
                                  }`}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </div>
                  </Listbox.Options>
                </Transition>
              </div>
            </>
          )}
        </Listbox>
      )}
    ></Controller>
  );
};

export default SelectAssignee;
