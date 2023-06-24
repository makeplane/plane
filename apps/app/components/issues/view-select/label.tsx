import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// components
import { Tooltip } from "components/ui";
// icons
import {
  CheckBadgeIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  RectangleGroupIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
// types
import { IIssue, IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";
import { Combobox, Transition } from "@headlessui/react";
import issuesService from "services/issues.service";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>, issueId: string) => void;
  noBorder?: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isNotAllowed: boolean;
};

export const ViewLabelSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  noBorder = false,
  setIsOpen,
  isNotAllowed,
}) => {
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: issueLabels } = useSWR<IIssueLabels[]>(
    projectId ? PROJECT_ISSUE_LABELS(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const filteredOptions =
    query === ""
      ? issueLabels
      : issueLabels?.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Combobox
      as="div"
      value={issue.labels_list}
      onChange={(data: any) => {
        partialUpdateIssue({ labels_list: data }, issue.id);
      }}
      className="relative flex-shrink-0"
      disabled={isNotAllowed}
      multiple
    >
      {({ open }: any) => (
        <>
          <Tooltip
            position="top-right"
            tooltipHeading="Labels"
            tooltipContent={
              issue.label_details.length > 0
                ? issue.label_details.map((label) => label.name).join(", ")
                : "No Label"
            }
          >
            <Combobox.Button
              className={`flex cursor-pointer items-center rounded-md border-brand-base text-xs shadow-sm duration-200 hover:bg-brand-surface-2 ${
                noBorder ? "" : "border"
              }`}
            >
              {issue.label_details.length > 0 ? (
                <div className="flex items-center gap-2 text-xs text-brand-secondary text-center p-2 group-hover:bg-brand-surface-2 border-brand-base">
                  {issue.label_details.slice(0, 4).map((label, index) => (
                    <div className={`flex h-4 w-4 rounded-full ${index ? "-ml-3.5" : ""}`}>
                      <span
                        className={`h-4 w-4 flex-shrink-0 rounded-full border group-hover:bg-brand-surface-2 border-brand-base
                          `}
                        style={{
                          backgroundColor:
                            label?.color && label.color !== "" ? label.color : "#000000",
                        }}
                      />
                    </div>
                  ))}
                  {issue.label_details.length > 4 ? (
                    <span>+{issue.label_details.length - 4}</span>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center text-xs text-brand-secondary text-center p-2 group-hover:bg-brand-surface-2 border-brand-base">
                  <TagIcon className="h-3.5 w-3.5 text-brand-secondary" />
                </div>
              )}
            </Combobox.Button>
          </Tooltip>

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
              className={`absolute z-10 mt-1 max-h-52 min-w-[8rem] overflow-auto rounded-md border-none
              bg-brand-surface-1 px-2 py-2 text-xs shadow-md focus:outline-none`}
            >
              <div className="flex w-full items-center justify-start rounded-sm  border-[0.6px] border-brand-base bg-brand-surface-1 px-2">
                <MagnifyingGlassIcon className="h-3 w-3 text-brand-secondary" />
                <Combobox.Input
                  className="w-full bg-transparent py-1 px-2 text-xs text-brand-secondary focus:outline-none"
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
                                  active ? "bg-brand-surface-2" : ""
                                } group flex min-w-[14rem] cursor-pointer select-none items-center gap-2 truncate rounded px-1 py-1.5 text-brand-secondary`
                              }
                              value={label.id}
                            >
                              {({ selected }) => (
                                <div className="flex w-full justify-between gap-2 rounded">
                                  <div className="flex items-center justify-start gap-2">
                                    <span
                                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                      style={{
                                        backgroundColor: label.color,
                                      }}
                                    />
                                    <span>{label.name}</span>
                                  </div>
                                  <div className="flex items-center justify-center rounded p-1">
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
                          <div className="border-y border-brand-base">
                            <div className="flex select-none items-center gap-2 truncate p-2 text-brand-base">
                              <RectangleGroupIcon className="h-3 w-3" /> {label.name}
                            </div>
                            <div>
                              {children.map((child) => (
                                <Combobox.Option
                                  key={child.id}
                                  className={({ active }) =>
                                    `${
                                      active ? "bg-brand-surface-2" : ""
                                    } group flex min-w-[14rem] cursor-pointer select-none items-center gap-2 truncate rounded px-1 py-1.5 text-brand-secondary`
                                  }
                                  value={child.id}
                                >
                                  {({ selected }) => (
                                    <div className="flex w-full justify-between gap-2 rounded">
                                      <div className="flex items-center justify-start gap-2">
                                        <span
                                          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                          style={{
                                            backgroundColor: child?.color,
                                          }}
                                        />
                                        <span>{child.name}</span>
                                      </div>
                                      <div className="flex items-center justify-center rounded p-1">
                                        <CheckBadgeIcon
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
                    <p className="px-2 text-xs text-brand-secondary">No labels found</p>
                  )
                ) : (
                  <p className="px-2 text-xs text-brand-secondary">Loading...</p>
                )}
                <button
                  type="button"
                  className="flex w-full select-none items-center rounded py-2 px-1 hover:bg-brand-surface-2"
                  onClick={() => setIsOpen(true)}
                >
                  <span className="flex items-center justify-start gap-1 text-brand-secondary">
                    <PlusIcon className="h-4 w-4" aria-hidden="true" />
                    <span>Create New Label</span>
                  </span>
                </button>
              </div>
            </Combobox.Options>
          </Transition>
        </>
      )}
    </Combobox>
  );
};
