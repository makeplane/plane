import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Combobox, Transition } from "@headlessui/react";
// icons
import {
  CheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  RectangleGroupIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
// services
import issuesServices from "services/issues.service";
// types
import type { IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";
import { IssueLabelList } from "components/ui";

type Props = {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string[];
  onChange: (value: string[]) => void;
  projectId: string;
};

export const IssueLabelSelect: React.FC<Props> = ({ setIsOpen, value, onChange, projectId }) => {
  // states
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: issueLabels } = useSWR<IIssueLabels[]>(
    projectId ? PROJECT_ISSUE_LABELS(projectId) : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssueLabels(workspaceSlug as string, projectId)
      : null
  );

  const filteredOptions =
    query === ""
      ? issueLabels
      : issueLabels?.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
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
                `flex items-center text-xs cursor-pointer border rounded-md shadow-sm duration-200 
              ${
                open
                  ? "outline-none border-theme bg-theme/5 ring-1 ring-theme "
                  : "hover:bg-theme/5 "
              }`
              }
            >
              {value && value.length > 0 ? (
                <span className="flex items-center justify-center text-xs gap-2 px-3 py-1">
                  <IssueLabelList
                    labels={value.map((v) => issueLabels?.find((l) => l.id === v)?.color) ?? []}
                    length={3}
                    showLength
                  />
                  <span className=" text-gray-600">{value.length} Labels</span>
                </span>
              ) : (
                <span className="flex items-center justify-center text-xs gap-2  px-3 py-1.5">
                  <TagIcon className="h-3 w-3 text-gray-500" />
                  <span className=" text-gray-500">Label</span>
                </span>
              )}
            </Combobox.Button>

            <Transition
              show={open}
              as={React.Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Combobox.Options
                className={`absolute z-10 max-h-52 min-w-[8rem] mt-1 px-2 py-2 text-xs
                rounded-md shadow-md overflow-auto border-none bg-white focus:outline-none`}
              >
                <div className="flex justify-start items-center rounded-sm border-[0.6px] bg-gray-100 border-gray-200 w-full px-2">
                  <MagnifyingGlassIcon className="h-3 w-3 text-gray-500" />
                  <Combobox.Input
                    className="w-full  bg-transparent py-1 px-2 text-xs text-gray-500 focus:outline-none"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search for label..."
                    displayValue={(assigned: any) => assigned?.name}
                  />
                </div>
                <div className="py-1.5">
                  {issueLabels && filteredOptions ? (
                    filteredOptions.length > 0 ? (
                      filteredOptions.map((label) => {
                        const children = issueLabels?.filter((l) => l.parent === label.id);

                        if (children.length === 0) {
                          if (!label.parent)
                            return (
                              <Combobox.Option
                                key={label.id}
                                className={({ active }) =>
                                  `${
                                    active ? "bg-gray-200" : ""
                                  } group flex min-w-[14rem] cursor-pointer select-none items-center gap-2 truncate rounded px-1 py-1.5 text-gray-600`
                                }
                                value={label.id}
                              >
                                {({ selected }) => (
                                  <div className="flex w-full gap-2 justify-between rounded">
                                    <div className="flex justify-start items-center gap-2">
                                      <span
                                        className="h-3 w-3 flex-shrink-0 rounded-full"
                                        style={{
                                          backgroundColor:
                                            label.color && label.color !== ""
                                              ? label.color
                                              : "#000",
                                        }}
                                      />
                                      <span>{label.name}</span>
                                    </div>
                                    <div className="flex justify-center items-center p-1 rounded">
                                      <CheckIcon
                                        className={`h-3 w-3 ${
                                          selected ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                    </div>
                                  </div>
                                )}
                              </Combobox.Option>
                            );
                        } else
                          return (
                            <div className="bg-gray-50 border-y border-gray-400">
                              <div className="flex select-none font-medium items-center gap-2 truncate p-2 text-gray-900">
                                <RectangleGroupIcon className="h-3 w-3" /> {label.name}
                              </div>
                              <div>
                                {children.map((child) => (
                                  <Combobox.Option
                                    key={child.id}
                                    className={({ active }) =>
                                      `${
                                        active ? "bg-gray-200" : ""
                                      } group flex min-w-[14rem] cursor-pointer select-none items-center gap-2 truncate rounded px-1 py-1.5 text-gray-600`
                                    }
                                    value={child.id}
                                  >
                                    {({ selected }) => (
                                      <div className="flex w-full gap-2 justify-between rounded">
                                        <div className="flex justify-start items-center gap-2">
                                          <span
                                            className="h-3 w-3 flex-shrink-0 rounded-full"
                                            style={{
                                              backgroundColor: child?.color ?? "black",
                                            }}
                                          />
                                          <span>{child.name}</span>
                                        </div>
                                        <div className="flex justify-center items-center p-1 rounded">
                                          <CheckIcon
                                            className={`h-3 w-3 ${
                                              selected ? "opacity-100" : "opacity-0"
                                            }`}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </Combobox.Option>
                                ))}
                              </div>
                            </div>
                          );
                      })
                    ) : (
                      <p className="text-xs text-gray-500 px-2">No labels found</p>
                    )
                  ) : (
                    <p className="text-xs text-gray-500 px-2">Loading...</p>
                  )}
                  <button
                    type="button"
                    className="flex select-none w-full items-center py-2 px-1 rounded hover:bg-gray-200"
                    onClick={() => setIsOpen(true)}
                  >
                    <span className="flex justify-start items-center gap-1">
                      <PlusIcon className="h-4 w-4 text-gray-600" aria-hidden="true" />
                      <span className="text-gray-600">Create New Label</span>
                    </span>
                  </button>
                </div>
              </Combobox.Options>
            </Transition>
          </>
        )}
      </Combobox>
    </>
  );
};
