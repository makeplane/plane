import React from "react";
// react hook form
import { Controller } from "react-hook-form";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// hooks
import useUser from "lib/hooks/useUser";
// icons
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
// ui
import { Spinner } from "ui";
// types
import type { Control } from "react-hook-form";
import type { IIssue } from "types";

type Props = {
  control: Control<IIssue, any>;
};

const SelectProject: React.FC<Props> = ({ control }) => {
  const { projects, setActiveProject } = useUser();

  return (
    <>
      <Controller
        control={control}
        name="project"
        render={({ field: { value, onChange } }) => (
          <Listbox
            value={value}
            onChange={(value) => {
              onChange(value);
              setActiveProject(projects?.find((i) => i.id === value));
            }}
          >
            {({ open }) => (
              <>
                <div className="relative">
                  <Listbox.Button className="flex items-center gap-1 bg-white relative border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <ClipboardDocumentListIcon className="h-3 w-3" />
                    <span className="block truncate">
                      {projects?.find((i) => i.id === value)?.identifier ?? "Project"}
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
                        {projects ? (
                          projects.length > 0 ? (
                            projects.map((project) => (
                              <Listbox.Option
                                key={project.id}
                                className={({ active }) =>
                                  `${
                                    active ? "text-white bg-theme" : "text-gray-900"
                                  } cursor-pointer select-none p-2 rounded-md`
                                }
                                value={project.id}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span
                                      className={`${
                                        selected ? "font-medium" : "font-normal"
                                      } block truncate`}
                                    >
                                      {project.name}
                                    </span>
                                  </>
                                )}
                              </Listbox.Option>
                            ))
                          ) : (
                            <p className="text-gray-400">No projects found!</p>
                          )
                        ) : (
                          <div className="flex justify-center">
                            <Spinner />
                          </div>
                        )}
                      </div>
                    </Listbox.Options>
                  </Transition>
                </div>
              </>
            )}
          </Listbox>
        )}
      ></Controller>
    </>
  );
};

export default SelectProject;
