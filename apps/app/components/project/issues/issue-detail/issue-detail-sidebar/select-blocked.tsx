import React, { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR from "swr";

import { SubmitHandler, useForm, UseFormWatch } from "react-hook-form";
// services
import issuesService from "lib/services/issues.service";
// constants
import { PROJECT_ISSUES_LIST } from "constants/fetch-keys";
// hooks
import useToast from "lib/hooks/useToast";
// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// ui
import { Button } from "ui";
// icons
import { FolderIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { BlockedIcon } from "ui/icons";
// types
import { IIssue } from "types";
// constants
import { classNames } from "constants/common";

type FormInput = {
  issue_ids: string[];
};

type Props = {
  submitChanges: (formData: Partial<IIssue>) => void;
  issuesList: IIssue[];
  watch: UseFormWatch<IIssue>;
};

const SelectBlocked: React.FC<Props> = ({ submitChanges, issuesList, watch }) => {
  const [query, setQuery] = useState("");
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const { data: issues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const { register, handleSubmit, reset, watch: watchBlocked } = useForm<FormInput>();

  const handleClose = () => {
    setIsBlockedModalOpen(false);
    reset();
  };

  const onSubmit: SubmitHandler<FormInput> = (data) => {
    if (!data.issue_ids || data.issue_ids.length === 0) {
      setToastAlert({
        title: "Error",
        type: "error",
        message: "Please select atleast one issue",
      });
      return;
    }

    if (!Array.isArray(data.issue_ids)) data.issue_ids = [data.issue_ids];

    const newBlocked = [...watch("blocked_list"), ...data.issue_ids];
    submitChanges({ blocks_list: newBlocked });
    handleClose();
  };

  return (
    <div className="flex flex-wrap items-start py-2">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <BlockedIcon height={16} width={16} />
        <p>Blocked by</p>
      </div>
      <div className="space-y-1 sm:basis-1/2">
        <div className="flex flex-wrap gap-1">
          {watch("blocked_list") && watch("blocked_list").length > 0
            ? watch("blocked_list").map((issue) => (
                <span
                  key={issue}
                  className="group flex cursor-pointer items-center gap-1 rounded-2xl border border-white px-1.5 py-0.5 text-xs text-red-500 duration-300 hover:border-red-500 hover:bg-red-50"
                  onClick={() => {
                    const updatedBlocked: string[] = watch("blocked_list").filter(
                      (i) => i !== issue
                    );
                    submitChanges({
                      blocks_list: updatedBlocked,
                    });
                  }}
                >
                  <Link
                    href={`/${workspaceSlug}/projects/${projectId}/issues/${
                      issues?.results.find((i) => i.id === issue)?.id
                    }`}
                  >
                    <a className="flex items-center gap-1">
                      <BlockedIcon height={10} width={10} />
                      {`${
                        issues?.results.find((i) => i.id === issue)?.project_detail?.identifier
                      }-${issues?.results.find((i) => i.id === issue)?.sequence_id}`}
                    </a>
                  </Link>
                  <span className="opacity-0 duration-300 group-hover:opacity-100">
                    <XMarkIcon className="h-2 w-2" />
                  </span>
                </span>
              ))
            : null}
        </div>
        <Transition.Root
          show={isBlockedModalOpen}
          as={React.Fragment}
          afterLeave={() => setQuery("")}
          appear
        >
          <Dialog as="div" className="relative z-10" onClose={handleClose}>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative mx-auto max-w-2xl transform divide-y divide-gray-500 divide-opacity-10 rounded-xl bg-white bg-opacity-80 shadow-2xl ring-1 ring-black ring-opacity-5 backdrop-blur backdrop-filter transition-all">
                  <form>
                    <Combobox>
                      <div className="relative m-1">
                        <MagnifyingGlassIcon
                          className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-900 text-opacity-40"
                          aria-hidden="true"
                        />
                        <Combobox.Input
                          className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder-gray-500 outline-none focus:ring-0 sm:text-sm"
                          placeholder="Search..."
                          onChange={(event) => setQuery(event.target.value)}
                        />
                      </div>

                      <Combobox.Options
                        static
                        className="max-h-80 scroll-py-2 divide-y divide-gray-500 divide-opacity-10 overflow-y-auto"
                      >
                        {issuesList.length > 0 && (
                          <>
                            <li className="p-2">
                              {query === "" && (
                                <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-900">
                                  Select blocked issues
                                </h2>
                              )}
                              <ul className="text-sm text-gray-700">
                                {issuesList.map((issue) => {
                                  if (
                                    !watch("blocked_list").includes(issue.id) &&
                                    !watch("blockers_list").includes(issue.id)
                                  ) {
                                    return (
                                      <Combobox.Option
                                        key={issue.id}
                                        as="label"
                                        htmlFor={`blocked-issue-${issue.id}`}
                                        value={{
                                          name: issue.name,
                                          url: `/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`,
                                        }}
                                        className={({ active }) =>
                                          classNames(
                                            "flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2",
                                            active ? "bg-gray-900 bg-opacity-5 text-gray-900" : ""
                                          )
                                        }
                                      >
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            {...register("issue_ids")}
                                            id={`blocked-issue-${issue.id}`}
                                            value={issue.id}
                                          />
                                          <span
                                            className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                            style={{
                                              backgroundColor: issue.state_detail.color,
                                            }}
                                          />
                                          <span className="flex-shrink-0 text-xs text-gray-500">
                                            {
                                              issues?.results.find((i) => i.id === issue.id)
                                                ?.project_detail?.identifier
                                            }
                                            -{issue.sequence_id}
                                          </span>
                                          <span>{issue.name}</span>
                                        </div>
                                      </Combobox.Option>
                                    );
                                  }
                                })}
                              </ul>
                            </li>
                          </>
                        )}
                      </Combobox.Options>

                      {query !== "" && issuesList.length === 0 && (
                        <div className="py-14 px-6 text-center sm:px-14">
                          <FolderIcon
                            className="mx-auto h-6 w-6 text-gray-900 text-opacity-40"
                            aria-hidden="true"
                          />
                          <p className="mt-4 text-sm text-gray-900">
                            We couldn{"'"}t find any issue with that term. Please try again.
                          </p>
                        </div>
                      )}
                    </Combobox>

                    <div className="flex items-center justify-end gap-2 p-3">
                      <div>
                        <Button type="button" theme="secondary" size="sm" onClick={handleClose}>
                          Close
                        </Button>
                      </div>
                      <Button onClick={handleSubmit(onSubmit)} size="sm">
                        Add selected issues
                      </Button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between gap-1 rounded-md border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          onClick={() => setIsBlockedModalOpen(true)}
        >
          Select issues
        </button>
      </div>
    </div>
  );
};

export default SelectBlocked;
