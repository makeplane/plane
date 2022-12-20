// react
import React, { useState } from "react";
// react-hook-form
import { SubmitHandler, useForm, UseFormWatch } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// ui
import { Button } from "ui";
// icons
import { FolderIcon, MagnifyingGlassIcon, FlagIcon, XMarkIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IssueResponse } from "types";
// constants
import { classNames } from "constants/common";
import issuesService from "lib/services/issues.service";

type FormInput = {
  issue_ids: string[];
};

type Props = {
  issueDetail: IIssue | undefined;
  issuesList: IIssue[];
  watch: UseFormWatch<IIssue>;
};

const SelectBlocked: React.FC<Props> = ({ issueDetail, issuesList, watch }) => {
  const [query, setQuery] = useState("");
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);

  const { activeWorkspace, activeProject, issues, mutateIssues } = useUser();
  const { setToastAlert } = useToast();

  const { register, handleSubmit, reset, watch: watchIssues } = useForm<FormInput>();

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

    data.issue_ids.map((issue) => {
      if (!activeWorkspace || !activeProject || !issueDetail) return;

      const currentBlockers =
        issues?.results
          .find((i) => i.id === issue)
          ?.blocker_issues.map((b) => b.blocker_issue_detail?.id ?? "") ?? [];

      issuesService
        .patchIssue(activeWorkspace.slug, activeProject.id, issue, {
          blockers_list: [...currentBlockers, issueDetail.id],
        })
        .then((response) => {
          mutateIssues((prevData) => ({
            ...(prevData as IssueResponse),
            results: (prevData?.results ?? []).map((issue) => {
              if (issue.id === issueDetail.id) {
                return { ...issue, ...response };
              }
              return issue;
            }),
          }));
        })
        .catch((error) => {
          console.log(error);
        });
    });

    // handleClose();
  };

  const removeBlocked = (issueId: string) => {
    if (!activeWorkspace || !activeProject || !issueDetail) return;

    const currentBlockers =
      issues?.results
        .find((i) => i.id === issueId)
        ?.blocker_issues.map((b) => b.blocker_issue_detail?.id ?? "") ?? [];

    const updatedBlockers = currentBlockers.filter((b) => b !== issueDetail.id);

    issuesService
      .patchIssue(activeWorkspace.slug, activeProject.id, issueId, {
        blockers_list: updatedBlockers,
      })
      .then((response) => {
        mutateIssues((prevData) => ({
          ...(prevData as IssueResponse),
          results: (prevData?.results ?? []).map((issue) => {
            if (issue.id === issueDetail.id) {
              return { ...issue, ...response };
            }
            return issue;
          }),
        }));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div className="flex items-start py-2 flex-wrap">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <FlagIcon className="flex-shrink-0 h-4 w-4" />
        <p>Blocked by</p>
      </div>
      <div className="sm:basis-1/2 space-y-1">
        <div className="flex gap-1 flex-wrap">
          {watch("blocked_list") && watch("blocked_list").length > 0
            ? watch("blocked_list").map((issue) => (
                <span
                  key={issue}
                  className="group flex items-center gap-1 border rounded-2xl text-xs px-1.5 py-0.5 text-red-500 hover:bg-red-50 border-red-500 cursor-pointer"
                  onClick={() => removeBlocked(issue)}
                >
                  {`${activeProject?.identifier}-${
                    issues?.results.find((i) => i.id === issue)?.sequence_id
                  }`}
                  <XMarkIcon className="h-2 w-2 group-hover:text-red-500" />
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
                          className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm outline-none"
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
                                        htmlFor={`issue-${issue.id}`}
                                        value={{
                                          name: issue.name,
                                          url: `/projects/${issue.project}/issues/${issue.id}`,
                                        }}
                                        className={({ active }) =>
                                          classNames(
                                            "flex items-center justify-between cursor-pointer select-none rounded-md px-3 py-2",
                                            active ? "bg-gray-900 bg-opacity-5 text-gray-900" : ""
                                          )
                                        }
                                      >
                                        {({ active }) => (
                                          <>
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="checkbox"
                                                {...register("issue_ids")}
                                                id={`issue-${issue.id}`}
                                                value={issue.id}
                                              />
                                              <span
                                                className="flex-shrink-0 h-1.5 w-1.5 block rounded-full"
                                                style={{
                                                  backgroundColor: issue.state_detail.color,
                                                }}
                                              />
                                              <span className="flex-shrink-0 text-xs text-gray-500">
                                                {activeProject?.identifier}-{issue.sequence_id}
                                              </span>
                                              <span>{issue.name}</span>
                                            </div>
                                          </>
                                        )}
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

                    <div className="flex justify-end items-center gap-2 p-3">
                      <Button onClick={handleSubmit(onSubmit)} size="sm">
                        Add selected issues
                      </Button>
                      <div>
                        <Button type="button" theme="danger" size="sm" onClick={handleClose}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>
        <button
          type="button"
          className="flex justify-between items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300 w-full"
          onClick={() => setIsBlockedModalOpen(true)}
        >
          Select issues
        </button>
      </div>
    </div>
  );
};

export default SelectBlocked;
