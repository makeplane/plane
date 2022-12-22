// react
import React, { useState } from "react";
// swr
import { mutate } from "swr";
// react hook form
import { SubmitHandler, useForm } from "react-hook-form";
// services
import issuesServices from "lib/services/issues.service";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// ui
import { Button } from "ui";
// icons
import { FolderIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IssueResponse } from "types";
// fetch keys
import { PROJECT_ISSUES_LIST } from "constants/fetch-keys";
// common
import { classNames } from "constants/common";

type FormInput = {
  issue_ids: string[];
  cycleId: string;
};

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const BulkDeleteIssuesModal: React.FC<Props> = ({ isOpen, setIsOpen }) => {
  const [query, setQuery] = useState("");

  const { activeWorkspace, activeProject, issues } = useUser();

  const { setToastAlert } = useToast();

  const filteredIssues: IIssue[] =
    query === ""
      ? issues?.results ?? []
      : issues?.results.filter((issue) => issue.name.toLowerCase().includes(query.toLowerCase())) ??
        [];

  const { register, handleSubmit, reset } = useForm<FormInput>();

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    reset();
  };

  const handleDelete: SubmitHandler<FormInput> = (data) => {
    if (!data.issue_ids || data.issue_ids.length === 0) {
      setToastAlert({
        title: "Error",
        type: "error",
        message: "Please select atleast one issue",
      });
      return;
    }

    if (activeWorkspace && activeProject) {
      issuesServices
        .bulkDeleteIssues(activeWorkspace.slug, activeProject.id, data)
        .then((res) => {
          setToastAlert({
            title: "Success",
            type: "success",
            message: res.message,
          });
          mutate<IssueResponse>(
            PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id),
            (prevData) => {
              return {
                ...(prevData as IssueResponse),
                count: (prevData?.results ?? []).filter(
                  (p) => !data.issue_ids.some((id) => p.id === id)
                ).length,
                results: (prevData?.results ?? []).filter(
                  (p) => !data.issue_ids.some((id) => p.id === id)
                ),
              };
            },
            false
          );
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  return (
    <>
      <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setQuery("")} appear>
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
                      {filteredIssues.length > 0 && (
                        <>
                          <li className="p-2">
                            {query === "" && (
                              <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-900">
                                Select issues
                              </h2>
                            )}
                            <ul className="text-sm text-gray-700">
                              {filteredIssues.map((issue) => (
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
                              ))}
                            </ul>
                          </li>
                        </>
                      )}
                    </Combobox.Options>

                    {query !== "" && filteredIssues.length === 0 && (
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
                    <Button onClick={handleSubmit(handleDelete)} theme="danger" size="sm">
                      Delete selected issues
                    </Button>
                    <div>
                      <Button type="button" size="sm" onClick={handleClose}>
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
    </>
  );
};

export default BulkDeleteIssuesModal;
