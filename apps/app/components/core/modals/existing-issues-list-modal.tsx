import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// services
import projectService from "services/project.service";
// hooks
import useToast from "hooks/use-toast";
import useIssuesView from "hooks/use-issues-view";
import useDebounce from "hooks/use-debounce";
// ui
import { Loader, PrimaryButton, SecondaryButton } from "components/ui";
// icons
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { LayerDiagonalIcon } from "components/icons";
// types
import { ISearchIssueResponse, TProjectIssuesSearchParams } from "types";
// fetch-keys
import {
  CYCLE_DETAILS,
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_DETAILS,
  MODULE_ISSUES_WITH_PARAMS,
} from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  searchParams: Partial<TProjectIssuesSearchParams>;
  handleOnSubmit: (data: ISearchIssueResponse[]) => Promise<void>;
};

export const ExistingIssuesListModal: React.FC<Props> = ({
  isOpen,
  handleClose: onClose,
  searchParams,
  handleOnSubmit,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedSearchTerm: string = useDebounce(searchTerm, 500);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { setToastAlert } = useToast();

  const { params } = useIssuesView();

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setSelectedIssues([]);
  };

  const onSubmit = async () => {
    if (selectedIssues.length === 0) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Please select at least one issue.",
      });

      return;
    }

    setIsSubmitting(true);

    await handleOnSubmit(selectedIssues).finally(() => setIsSubmitting(false));

    if (cycleId) {
      mutate(CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params));
      mutate(CYCLE_DETAILS(cycleId as string));
    }

    if (moduleId) {
      mutate(MODULE_ISSUES_WITH_PARAMS(moduleId as string, params));
      mutate(MODULE_DETAILS(moduleId as string));
    }

    handleClose();

    setToastAlert({
      title: "Success",
      type: "success",
      message: `Issue${selectedIssues.length > 1 ? "s" : ""} added successfully`,
    });
  };

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;

    setIsLoading(true);

    if (debouncedSearchTerm) {
      setIsSearching(true);

      projectService
        .projectIssuesSearch(workspaceSlug as string, projectId as string, {
          search: debouncedSearchTerm,
          ...searchParams,
        })
        .then((res) => {
          setIssues(res);
        })
        .finally(() => {
          setIsLoading(false);
          setIsSearching(false);
        });
    } else {
      setIssues([]);
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, workspaceSlug, projectId, searchParams]);

  return (
    <>
      <Transition.Root
        show={isOpen}
        as={React.Fragment}
        afterLeave={() => setSearchTerm("")}
        appear
      >
        <Dialog as="div" className="relative z-20" onClose={handleClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-brand-backdrop bg-opacity-50 transition-opacity" />
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
              <Dialog.Panel className="relative mx-auto max-w-2xl transform rounded-xl border border-brand-base bg-brand-base shadow-2xl transition-all">
                <Combobox
                  as="div"
                  onChange={(val: ISearchIssueResponse) => {
                    if (selectedIssues.some((i) => i.id === val.id))
                      setSelectedIssues((prevData) => prevData.filter((i) => i.id !== val.id));
                    else setSelectedIssues((prevData) => [...prevData, val]);
                  }}
                >
                  <div className="relative m-1">
                    <MagnifyingGlassIcon
                      className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-brand-base text-opacity-40"
                      aria-hidden="true"
                    />
                    <Combobox.Input
                      className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-brand-base placeholder-gray-500 outline-none focus:ring-0 sm:text-sm"
                      placeholder="Type to search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="text-brand-secondary text-[0.825rem] p-2">
                    {selectedIssues.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {selectedIssues.map((issue) => (
                          <div
                            key={issue.id}
                            className="flex items-center gap-1 text-xs border border-brand-base bg-brand-surface-2 pl-2 py-1 rounded-md text-brand-base whitespace-nowrap"
                          >
                            {issue.project__identifier}-{issue.sequence_id}
                            <button
                              type="button"
                              className="group p-1"
                              onClick={() =>
                                setSelectedIssues((prevData) =>
                                  prevData.filter((i) => i.id !== issue.id)
                                )
                              }
                            >
                              <XMarkIcon className="h-3 w-3 text-brand-secondary group-hover:text-brand-base" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-min text-xs border border-brand-base bg-brand-surface-2 p-2 rounded-md whitespace-nowrap">
                        No issues selected
                      </div>
                    )}
                  </div>

                  <Combobox.Options static className="max-h-80 scroll-py-2 overflow-y-auto mt-2">
                    {debouncedSearchTerm !== "" && (
                      <h5 className="text-[0.825rem] text-brand-secondary mx-2">
                        Search results for{" "}
                        <span className="text-brand-base">
                          {'"'}
                          {debouncedSearchTerm}
                          {'"'}
                        </span>{" "}
                        in project:
                      </h5>
                    )}

                    {!isLoading &&
                      issues.length === 0 &&
                      searchTerm !== "" &&
                      debouncedSearchTerm !== "" && (
                        <div className="flex flex-col items-center justify-center gap-4 px-3 py-8 text-center">
                          <LayerDiagonalIcon height="52" width="52" />
                          <h3 className="text-brand-secondary">
                            No issues found. Create a new issue with{" "}
                            <pre className="inline rounded bg-brand-surface-2 px-2 py-1 text-sm">
                              C
                            </pre>
                            .
                          </h3>
                        </div>
                      )}

                    {isLoading || isSearching ? (
                      <Loader className="space-y-3 p-3">
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                      </Loader>
                    ) : (
                      <ul className={`text-sm text-brand-base ${issues.length > 0 ? "p-2" : ""}`}>
                        {issues.map((issue) => {
                          const selected = selectedIssues.some((i) => i.id === issue.id);

                          return (
                            <Combobox.Option
                              key={issue.id}
                              as="label"
                              htmlFor={`issue-${issue.id}`}
                              value={issue}
                              className={({ active }) =>
                                `flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-brand-secondary ${
                                  active ? "bg-brand-surface-2 text-brand-base" : ""
                                } ${selected ? "text-brand-base" : ""}`
                              }
                            >
                              <input type="checkbox" checked={selected} readOnly />
                              <span
                                className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                style={{
                                  backgroundColor: issue.state__color,
                                }}
                              />
                              <span className="flex-shrink-0 text-xs">
                                {issue.project__identifier}-{issue.sequence_id}
                              </span>
                              {issue.name}
                            </Combobox.Option>
                          );
                        })}
                      </ul>
                    )}
                  </Combobox.Options>
                </Combobox>
                {selectedIssues.length > 0 && (
                  <div className="flex items-center justify-end gap-2 p-3">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <PrimaryButton onClick={onSubmit} loading={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add selected issues"}
                    </PrimaryButton>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
