"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
// icons
import { Rocket, Search } from "lucide-react";
// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// types
import { ISearchIssueResponse } from "@plane/types";
// ui
import { Loader, ToggleSwitch, Tooltip } from "@plane/ui";
// components
import { IssueSearchModalEmptyState } from "@/components/core";
// helpers
import { getTabIndex } from "@/helpers/tab-indices.helper";
// hooks
import useDebounce from "@/hooks/use-debounce";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";
// services
import { ProjectService } from "@/services/project";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  value?: any;
  onChange: (issue: ISearchIssueResponse) => void;
  projectId: string | undefined;
  issueId?: string;
};

// services
const projectService = new ProjectService();

export const ParentIssuesListModal: React.FC<Props> = ({
  isOpen,
  handleClose: onClose,
  value,
  onChange,
  projectId,
  issueId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);
  const { isMobile } = usePlatformOS();
  const debouncedSearchTerm: string = useDebounce(searchTerm, 500);

  const { workspaceSlug } = useParams();

  const { baseTabIndex } = getTabIndex(undefined, isMobile);

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setIsWorkspaceLevel(false);
  };

  useEffect(() => {
    if (!isOpen || !workspaceSlug || !projectId) return;

    setIsSearching(true);
    setIsLoading(true);

    projectService
      .projectIssuesSearch(workspaceSlug as string, projectId as string, {
        search: debouncedSearchTerm,
        parent: true,
        issue_id: issueId,
        workspace_search: isWorkspaceLevel,
      })
      .then((res) => setIssues(res))
      .finally(() => {
        setIsSearching(false);
        setIsLoading(false);
      });
  }, [debouncedSearchTerm, isOpen, issueId, isWorkspaceLevel, projectId, workspaceSlug]);

  return (
    <>
      <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setSearchTerm("")} appear>
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
            <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-20 overflow-y-auto p-4 sm:p-6 md:p-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative mx-auto max-w-2xl transform rounded-lg bg-custom-background-100 shadow-custom-shadow-md transition-all">
                <Combobox
                  value={value}
                  onChange={(val) => {
                    onChange(val);
                    handleClose();
                  }}
                >
                  <div className="relative m-1">
                    <Search
                      className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-custom-text-100 text-opacity-40"
                      aria-hidden="true"
                    />
                    <Combobox.Input
                      className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-custom-text-100 outline-none placeholder:text-custom-text-400 focus:ring-0 sm:text-sm"
                      placeholder="Type to search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      displayValue={() => ""}
                      tabIndex={baseTabIndex}
                    />
                  </div>
                  <div className="flex p-2 sm:justify-end">
                    <Tooltip tooltipContent="Toggle workspace level search" isMobile={isMobile}>
                      <div
                        className={`flex flex-shrink-0 cursor-pointer items-center gap-1 text-xs ${
                          isWorkspaceLevel ? "text-custom-text-100" : "text-custom-text-200"
                        }`}
                      >
                        <ToggleSwitch
                          value={isWorkspaceLevel}
                          onChange={() => setIsWorkspaceLevel((prevData) => !prevData)}
                          label="Workspace level"
                        />
                        <button
                          type="button"
                          onClick={() => setIsWorkspaceLevel((prevData) => !prevData)}
                          className="flex-shrink-0"
                        >
                          Workspace Level
                        </button>
                      </div>
                    </Tooltip>
                  </div>
                  <Combobox.Options
                    static
                    className="max-h-80 scroll-py-2 overflow-y-auto vertical-scrollbar scrollbar-md"
                  >
                    {searchTerm !== "" && (
                      <h5 className="mx-2 text-[0.825rem] text-custom-text-200">
                        Search results for{" "}
                        <span className="text-custom-text-100">
                          {'"'}
                          {searchTerm}
                          {'"'}
                        </span>{" "}
                        in project:
                      </h5>
                    )}

                    {isSearching || isLoading ? (
                      <Loader className="space-y-3 p-3">
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                      </Loader>
                    ) : (
                      <>
                        {issues.length === 0 ? (
                          <IssueSearchModalEmptyState
                            debouncedSearchTerm={debouncedSearchTerm}
                            isSearching={isSearching}
                            issues={issues}
                            searchTerm={searchTerm}
                          />
                        ) : (
                          <ul className={`text-sm ${issues.length > 0 ? "p-2" : ""}`}>
                            {issues.map((issue) => (
                              <Combobox.Option
                                key={issue.id}
                                value={issue}
                                className={({ active, selected }) =>
                                  `group flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 my-0.5 text-custom-text-200 ${
                                    active ? "bg-custom-background-80 text-custom-text-100" : ""
                                  } ${selected ? "text-custom-text-100" : ""}`
                                }
                              >
                                <div className="flex flex-grow items-center gap-2 truncate">
                                  <span
                                    className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                    style={{
                                      backgroundColor: issue.state__color,
                                    }}
                                  />
                                  <span className="flex-shrink-0">
                                    <IssueIdentifier
                                      projectId={issue.project_id}
                                      issueTypeId={issue.type_id}
                                      projectIdentifier={issue.project__identifier}
                                      issueSequenceId={issue.sequence_id}
                                      textContainerClassName="text-xs text-custom-text-200"
                                    />
                                  </span>{" "}
                                  <span className="truncate">{issue.name}</span>
                                </div>
                                <a
                                  href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
                                  target="_blank"
                                  className="z-1 relative hidden flex-shrink-0 text-custom-text-200 hover:text-custom-text-100 group-hover:block"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Rocket className="h-4 w-4" />
                                </a>
                              </Combobox.Option>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </Combobox.Options>
                </Combobox>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
