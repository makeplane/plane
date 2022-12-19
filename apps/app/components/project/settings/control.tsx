// react
import React from "react";
// swr
import useSWR from "swr";
// react-hook-form
import { Control, Controller } from "react-hook-form";
// services
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// ui
import { Button } from "ui";
// icons
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
// types
import { IProject } from "types";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";

type Props = {
  control: Control<IProject, any>;
  isSubmitting: boolean;
};

const ControlSettings: React.FC<Props> = ({ control, isSubmitting }) => {
  const { activeWorkspace } = useUser();

  const { data: people } = useSWR(
    activeWorkspace ? WORKSPACE_MEMBERS : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );
  return (
    <>
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Control</h3>
          <p className="mt-1 text-sm text-gray-500">Set the control for the project.</p>
        </div>
        <div className="flex justify-between gap-3">
          <div className="w-full md:w-1/2">
            <Controller
              control={control}
              name="project_lead"
              render={({ field: { onChange, value } }) => (
                <Listbox value={value} onChange={onChange}>
                  {({ open }) => (
                    <>
                      <Listbox.Label>
                        <div className="text-gray-500 mb-2">Project Lead</div>
                      </Listbox.Label>
                      <div className="relative">
                        <Listbox.Button className="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                          <span className="block truncate">
                            {people?.find((person) => person.member.id === value)?.member
                              .first_name ?? "Select Lead"}
                          </span>
                          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>

                        <Transition
                          show={open}
                          as={React.Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                            {people?.map((person) => (
                              <Listbox.Option
                                key={person.id}
                                className={({ active }) =>
                                  `${
                                    active ? "text-white bg-theme" : "text-gray-900"
                                  } cursor-default select-none relative py-2 pl-3 pr-9`
                                }
                                value={person.member.id}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span
                                      className={`${
                                        selected ? "font-semibold" : "font-normal"
                                      } block truncate`}
                                    >
                                      {person.member.first_name}
                                    </span>

                                    {selected ? (
                                      <span
                                        className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                          active ? "text-white" : "text-theme"
                                        }`}
                                      >
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </>
                  )}
                </Listbox>
              )}
            />
          </div>
          <div className="w-full md:w-1/2">
            <Controller
              control={control}
              name="default_assignee"
              render={({ field: { value, onChange } }) => (
                <Listbox value={value} onChange={onChange}>
                  {({ open }) => (
                    <>
                      <Listbox.Label>
                        <div className="text-gray-500 mb-2">Default Assignee</div>
                      </Listbox.Label>
                      <div className="relative">
                        <Listbox.Button className="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                          <span className="block truncate">
                            {people?.find((p) => p.member.id === value)?.member.first_name ??
                              "Select Default Assignee"}
                          </span>
                          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>

                        <Transition
                          show={open}
                          as={React.Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                            {people?.map((person) => (
                              <Listbox.Option
                                key={person.id}
                                className={({ active }) =>
                                  `${
                                    active ? "text-white bg-theme" : "text-gray-900"
                                  } cursor-default select-none relative py-2 pl-3 pr-9`
                                }
                                value={person.member.id}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span
                                      className={`${
                                        selected ? "font-semibold" : "font-normal"
                                      } block truncate`}
                                    >
                                      {person.member.first_name}
                                    </span>

                                    {selected ? (
                                      <span
                                        className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                          active ? "text-white" : "text-theme"
                                        }`}
                                      >
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </>
                  )}
                </Listbox>
              )}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating Project..." : "Update Project"}
          </Button>
        </div>
      </section>
    </>
  );
};

export default ControlSettings;
