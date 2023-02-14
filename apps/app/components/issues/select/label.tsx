import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Combobox, Transition } from "@headlessui/react";
// icons
import { PlusIcon, RectangleGroupIcon, TagIcon } from "@heroicons/react/24/outline";
// services
import issuesServices from "services/issues.service";
// types
import type { IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

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
            <Combobox.Label className="sr-only">Labels</Combobox.Label>
            <Combobox.Button
              className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
            >
              <TagIcon className="h-3 w-3 text-gray-500" />
              <span className={`flex items-center gap-2 ${!value ? "" : "text-gray-900"}`}>
                {Array.isArray(value)
                  ? value.map((v) => issueLabels?.find((l) => l.id === v)?.name).join(", ") ||
                    "Labels"
                  : issueLabels?.find((l) => l.id === value)?.name || "Labels"}
              </span>
            </Combobox.Button>

            <Transition
              show={open}
              as={React.Fragment}
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
                  {issueLabels && filteredOptions ? (
                    filteredOptions.length > 0 ? (
                      filteredOptions.map((label) => {
                        const children = issueLabels?.filter((l) => l.parent === label.id);

                        if (children.length === 0) {
                          if (!label.parent)
                            return (
                              <Combobox.Option
                                key={label.id}
                                className={({ active, selected }) =>
                                  `${active ? "bg-indigo-50" : ""} ${
                                    selected ? "bg-indigo-50 font-medium" : ""
                                  } flex cursor-pointer select-none items-center gap-2 truncate p-2 text-gray-900`
                                }
                                value={label.id}
                              >
                                <span
                                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: label?.color ?? "green",
                                  }}
                                />
                                {label.name}
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
                                    className={({ active, selected }) =>
                                      `${active ? "bg-indigo-50" : ""} ${
                                        selected ? "bg-indigo-50 font-medium" : ""
                                      } flex cursor-pointer select-none items-center gap-2 truncate p-2 text-gray-900`
                                    }
                                    value={child.id}
                                  >
                                    <span
                                      className="h-2 w-2 flex-shrink-0 rounded-full"
                                      style={{
                                        backgroundColor: child?.color ?? "green",
                                      }}
                                    />
                                    {child.name}
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
                    className="flex select-none w-full items-center gap-2 p-2 text-gray-400 outline-none hover:bg-indigo-50 hover:text-gray-900"
                    onClick={() => setIsOpen(true)}
                  >
                    <PlusIcon className="h-3 w-3 text-gray-400" aria-hidden="true" />
                    <span className="text-xs whitespace-nowrap">Create label</span>
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
