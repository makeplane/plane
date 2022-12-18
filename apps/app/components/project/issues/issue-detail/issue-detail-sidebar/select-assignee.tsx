// react
import React from "react";
// next
import Image from "next/image";
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
import { Spinner } from "ui";
// icons
import { ArrowPathIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import User from "public/user.png";
// types
import { IIssue } from "types";
// constants
import { classNames } from "constants/common";
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (formData: Partial<IIssue>) => void;
};

const SelectAssignee: React.FC<Props> = ({ control, submitChanges }) => {
  const { activeWorkspace } = useUser();

  const { data: people } = useSWR(
    activeWorkspace ? WORKSPACE_MEMBERS(activeWorkspace.slug) : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );

  return (
    <div className="flex items-center py-2 flex-wrap">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <ArrowPathIcon className="flex-shrink-0 h-4 w-4" />
        <p>Assignees</p>
      </div>
      <div className="sm:basis-1/2">
        <Controller
          control={control}
          name="assignees_list"
          render={({ field: { value } }) => (
            <Listbox
              as="div"
              value={value}
              multiple={true}
              onChange={(value: any) => {
                submitChanges({ assignees_list: value });
              }}
              className="flex-shrink-0"
            >
              {({ open }) => (
                <div className="relative">
                  <Listbox.Button className="w-full flex justify-end items-center gap-1 text-xs cursor-pointer">
                    <span
                      className={classNames(
                        value ? "" : "text-gray-900",
                        "hidden truncate sm:block text-left"
                      )}
                    >
                      <div className="flex items-center gap-1 text-xs cursor-pointer">
                        {value && Array.isArray(value) ? (
                          <>
                            {value.length > 0 ? (
                              value.map((assignee, index: number) => {
                                const person = people?.find(
                                  (p) => p.member.id === assignee
                                )?.member;

                                return (
                                  <div
                                    key={index}
                                    className={`relative z-[1] h-5 w-5 rounded-full ${
                                      index !== 0 ? "-ml-2.5" : ""
                                    }`}
                                  >
                                    {person && person.avatar && person.avatar !== "" ? (
                                      <div className="h-5 w-5 border-2 bg-white border-white rounded-full">
                                        <Image
                                          src={person.avatar}
                                          height="100%"
                                          width="100%"
                                          className="rounded-full"
                                          alt={person.first_name}
                                        />
                                      </div>
                                    ) : (
                                      <div
                                        className={`h-5 w-5 bg-gray-700 text-white border-2 border-white grid place-items-center rounded-full`}
                                      >
                                        {person?.first_name.charAt(0)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="h-5 w-5 border-2 bg-white border-white rounded-full">
                                <Image
                                  src={User}
                                  height="100%"
                                  width="100%"
                                  className="rounded-full"
                                  alt="No user"
                                />
                              </div>
                            )}
                          </>
                        ) : null}
                      </div>
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={React.Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 right-0 mt-1 w-auto bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                      <div className="py-1">
                        {people ? (
                          people.length > 0 ? (
                            people.map((option) => (
                              <Listbox.Option
                                key={option.member.id}
                                className={({ active, selected }) =>
                                  `${
                                    active || selected ? "bg-indigo-50" : ""
                                  } flex items-center gap-2 text-gray-900 cursor-pointer select-none p-2 truncate`
                                }
                                value={option.member.id}
                              >
                                {option.member.avatar && option.member.avatar !== "" ? (
                                  <div className="relative h-4 w-4">
                                    <Image
                                      src={option.member.avatar}
                                      alt="avatar"
                                      className="rounded-full"
                                      layout="fill"
                                      objectFit="cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 h-4 w-4 bg-gray-700 text-white grid place-items-center capitalize rounded-full">
                                    {option.member.first_name && option.member.first_name !== ""
                                      ? option.member.first_name.charAt(0)
                                      : option.member.email.charAt(0)}
                                  </div>
                                )}
                                {option.member.first_name && option.member.first_name !== ""
                                  ? option.member.first_name
                                  : option.member.email}
                              </Listbox.Option>
                            ))
                          ) : (
                            <div className="text-center">No assignees found</div>
                          )
                        ) : (
                          <Spinner />
                        )}
                      </div>
                    </Listbox.Options>
                  </Transition>
                </div>
              )}
            </Listbox>
          )}
        />
      </div>
    </div>
  );
};

export default SelectAssignee;
