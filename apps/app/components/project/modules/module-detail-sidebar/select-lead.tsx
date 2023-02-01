import React from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { Control, Controller } from "react-hook-form";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// services
import workspaceService from "services/workspace.service";
// icons
import { UserIcon } from "@heroicons/react/24/outline";
import User from "public/user.png";
// types
import { IModule, IUserLite } from "types";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";

type Props = {
  control: Control<Partial<IModule>, any>;
  submitChanges: (formData: Partial<IModule>) => void;
  lead: IUserLite | null;
};

const SelectLead: React.FC<Props> = ({ control, submitChanges, lead }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: people } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
  );

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <UserIcon className="h-4 w-4 flex-shrink-0" />
        <p>Lead</p>
      </div>
      <div className="sm:basis-1/2">
        <Controller
          control={control}
          name="lead"
          render={({ field: { value } }) => (
            <Listbox
              as="div"
              value={value}
              onChange={(value: any) => {
                submitChanges({ lead: value });
              }}
              className="flex-shrink-0"
            >
              {({ open }) => (
                <div className="relative">
                  <Listbox.Button className="flex w-full cursor-pointer items-center gap-1 text-xs">
                    <span
                      className={`hidden truncate text-left sm:block ${
                        value ? "" : "text-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs">
                        {lead ? (
                          lead.avatar && lead.avatar !== "" ? (
                            <div className="h-5 w-5 rounded-full border-2 border-transparent">
                              <Image
                                src={lead.avatar}
                                height="100%"
                                width="100%"
                                className="rounded-full"
                                alt={lead?.first_name}
                              />
                            </div>
                          ) : (
                            <div className="grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-gray-700 capitalize text-white">
                              {lead?.first_name && lead.first_name !== ""
                                ? lead.first_name.charAt(0)
                                : lead?.email.charAt(0)}
                            </div>
                          )
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-white bg-white">
                            <Image
                              src={User}
                              height="100%"
                              width="100%"
                              className="rounded-full"
                              alt="No user"
                            />
                          </div>
                        )}
                        {lead
                          ? lead?.first_name && lead.first_name !== ""
                            ? lead?.first_name
                            : lead?.email
                          : "N/A"}
                      </div>
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={React.Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        {people ? (
                          people.length > 0 ? (
                            people.map((option) => (
                              <Listbox.Option
                                key={option.member.id}
                                className={({ active, selected }) =>
                                  `${
                                    active || selected ? "bg-indigo-50" : ""
                                  } flex cursor-pointer select-none items-center gap-2 truncate p-2 text-gray-900`
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
                                  <div className="grid h-4 w-4 flex-shrink-0 place-items-center rounded-full bg-gray-700 capitalize text-white">
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
                            <div className="text-center">No members found</div>
                          )
                        ) : (
                          <p className="text-xs text-gray-500 px-2">Loading...</p>
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

export default SelectLead;
