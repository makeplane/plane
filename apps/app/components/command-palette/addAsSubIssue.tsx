// react
import React, { useState } from "react";
// swr
import { mutate } from "swr";
// react hook form
import { useForm } from "react-hook-form";
// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// services
import issuesServices from "lib/services/issues.services";
// hooks
import useUser from "lib/hooks/useUser";
// icons
import { RectangleStackIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
// commons
import { classNames } from "constants/common";
// types
import { IIssue, IssueResponse } from "types";
// constants
import { PROJECT_ISSUES_LIST } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  parent: IIssue | undefined;
};

type FormInput = {
  issue_ids: string[];
  cycleId: string;
};

const AddAsSubIssue: React.FC<Props> = ({ isOpen, setIsOpen, parent }) => {
  const [query, setQuery] = useState("");

  const { activeWorkspace, activeProject, issues } = useUser();

  const filteredIssues: IIssue[] =
    query === ""
      ? issues?.results ?? []
      : issues?.results.filter((issue) => issue.name.toLowerCase().includes(query.toLowerCase())) ??
        [];

  const {
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormInput>();

  const handleCommandPaletteClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  const addAsSubIssue = (issueId: string) => {
    if (activeWorkspace && activeProject) {
      issuesServices
        .patchIssue(activeWorkspace.slug, activeProject.id, issueId, { parent: parent?.id })
        .then((res) => {
          mutate<IssueResponse>(
            PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id),
            (prevData) => ({
              ...(prevData as IssueResponse),
              results: (prevData?.results ?? []).map((p) =>
                p.id === issueId ? { ...p, ...res } : p
              ),
            }),
            false
          );
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setQuery("")} appear>
      <Dialog as="div" className="relative z-10" onClose={handleCommandPaletteClose}>
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
              <Combobox>
                <div className="relative m-1">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-900 text-opacity-40"
                    aria-hidden="true"
                  />
                  <Combobox.Input
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm outline-none"
                    placeholder="Search..."
                    onChange={(e) => setQuery(e.target.value)}
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
                            Issues
                          </h2>
                        )}
                        <ul className="text-sm text-gray-700">
                          {filteredIssues.map((issue) => {
                            if (
                              (issue.parent === "" || issue.parent === null) && // issue does not have any other parent
                              issue.id !== parent?.id && // issue is not itself
                              issue.id !== parent?.parent // issue is not it's parent
                            )
                              return (
                                <Combobox.Option
                                  key={issue.id}
                                  value={{
                                    name: issue.name,
                                  }}
                                  className={({ active }) =>
                                    classNames(
                                      "flex items-center gap-2 cursor-pointer select-none rounded-md px-3 py-2",
                                      active ? "bg-gray-900 bg-opacity-5 text-gray-900" : ""
                                    )
                                  }
                                  onClick={() => {
                                    addAsSubIssue(issue.id);
                                    setIsOpen(false);
                                  }}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 block rounded-full`}
                                    style={{
                                      backgroundColor: issue.state_detail.color,
                                    }}
                                  />
                                  {issue.name}
                                </Combobox.Option>
                              );
                          })}
                        </ul>
                      </li>
                    </>
                  )}
                </Combobox.Options>

                {query !== "" && filteredIssues.length === 0 && (
                  <div className="py-14 px-6 text-center sm:px-14">
                    <RectangleStackIcon
                      className="mx-auto h-6 w-6 text-gray-900 text-opacity-40"
                      aria-hidden="true"
                    />
                    <p className="mt-4 text-sm text-gray-900">
                      We couldn{"'"}t find any issue with that term. Please try again.
                    </p>
                  </div>
                )}
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default AddAsSubIssue;
