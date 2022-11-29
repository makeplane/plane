import React from "react";
// react hook form
import { Controller } from "react-hook-form";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// hooks
import useUser from "lib/hooks/useUser";
// icons
import { CheckIcon } from "@heroicons/react/20/solid";
// types
import type { IIssue } from "types";
import type { Control } from "react-hook-form";
import { UserIcon } from "@heroicons/react/24/outline";

type Props = {
  control: Control<IIssue, any>;
};

const SelectParent: React.FC<Props> = ({ control }) => {
  const { issues: projectIssues } = useUser();

  const getSelectedIssueKey = (issueId: string | undefined) => {
    const identifier = projectIssues?.results?.find((i) => i.id.toString() === issueId?.toString())
      ?.project_detail.identifier;

    const sequenceId = projectIssues?.results?.find(
      (i) => i.id.toString() === issueId?.toString()
    )?.sequence_id;

    if (issueId) return `${identifier}-${sequenceId}`;
    else return "Parent issue";
  };

  return (
    <Controller
      control={control}
      name="parent"
      render={({ field: { value, onChange } }) => (
        <Listbox as="div" value={value} onChange={onChange}>
          {({ open }) => (
            <>
              <div className="relative">
                <Listbox.Button className="flex items-center gap-1 hover:bg-gray-100 relative border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm duration-300">
                  <UserIcon className="h-3 w-3 flex-shrink-0" />
                  <span className="block truncate">{getSelectedIssueKey(value?.toString())}</span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={React.Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute mt-1 bg-white shadow-lg max-h-28 max-w-[15rem] rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                    <div className="p-1">
                      {projectIssues?.results?.map((issue) => (
                        <Listbox.Option
                          key={issue.id}
                          value={issue.id}
                          className={({ active }) =>
                            `relative cursor-pointer select-none p-2 rounded-md ${
                              active ? "bg-theme text-white" : "text-gray-900"
                            }`
                          }
                        >
                          {({ active, selected }) => (
                            <>
                              <span className={`block truncate ${selected && "font-medium"}`}>
                                <span className="font-medium">
                                  {issue.project_detail.identifier}-{issue.sequence_id}
                                </span>{" "}
                                {issue.name}
                              </span>
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
    />
  );
};

export default SelectParent;
