import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// services
import { ProjectService } from "services/project";
// hooks
import useDebounce from "hooks/use-debounce";
// components
import { LayerDiagonalIcon } from "components/icons";
// ui
import { Loader, ToggleSwitch, Tooltip } from "@plane/ui";
// icons
import { LaunchOutlined } from "@mui/icons-material";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
// types
import { ISearchIssueResponse } from "types";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  value?: any;
  onChange: (issue: ISearchIssueResponse) => void;
  projectId: string;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);

  const debouncedSearchTerm: string = useDebounce(searchTerm, 500);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setIsWorkspaceLevel(false);
  };

  useEffect(() => {
    if (!isOpen || !workspaceSlug || !projectId) return;

    setIsSearching(true);

    projectService
      .projectIssuesSearch(workspaceSlug as string, projectId as string, {
        search: debouncedSearchTerm,
        parent: true,
        issue_id: issueId,
        workspace_search: isWorkspaceLevel,
      })
      .then((res) => setIssues(res))
      .finally(() => setIsSearching(false));
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
            <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
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
              <Dialog.Panel className="relative mx-auto max-w-2xl transform rounded-xl border border-custom-border-200 bg-custom-background-100 shadow-2xl transition-all">
                <Combobox
                  value={value}
                  onChange={(val) => {
                    onChange(val);
                    handleClose();
                  }}
                >
                  <div className="relative m-1">
                    <MagnifyingGlassIcon
                      className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-custom-text-100 text-opacity-40"
                      aria-hidden="true"
                    />
                    <Combobox.Input
                      className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-custom-text-100 outline-none focus:ring-0 sm:text-sm placeholder:text-custom-text-400"
                      placeholder="Type to search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      displayValue={() => ""}
                    />
                  </div>
                  <div className="flex sm:justify-end p-2">
                    <Tooltip tooltipContent="Toggle workspace level search">
                      <div
                        className={`flex-shrink-0 flex items-center gap-1 text-xs cursor-pointer ${
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
                  <Combobox.Options static className="max-h-80 scroll-py-2 overflow-y-auto">
                    {searchTerm !== "" && (
                      <h5 className="text-[0.825rem] text-custom-text-200 mx-2">
                        Search results for{" "}
                        <span className="text-custom-text-100">
                          {'"'}
                          {searchTerm}
                          {'"'}
                        </span>{" "}
                        in project:
                      </h5>
                    )}

                    {!isSearching && issues.length === 0 && searchTerm !== "" && debouncedSearchTerm !== "" && (
                      <div className="flex flex-col items-center justify-center gap-4 px-3 py-8 text-center">
                        <LayerDiagonalIcon height="52" width="52" />
                        <h3 className="text-custom-text-200">
                          No issues found. Create a new issue with{" "}
                          <pre className="inline rounded bg-custom-background-80 px-2 py-1 text-sm">C</pre>.
                        </h3>
                      </div>
                    )}

                    {isSearching ? (
                      <Loader className="space-y-3 p-3">
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                      </Loader>
                    ) : (
                      <ul className={`text-sm ${issues.length > 0 ? "p-2" : ""}`}>
                        {issues.map((issue) => (
                          <Combobox.Option
                            key={issue.id}
                            value={issue}
                            className={({ active, selected }) =>
                              `group flex items-center justify-between gap-2 cursor-pointer select-none rounded-md px-3 py-2 text-custom-text-200 ${
                                active ? "bg-custom-background-80 text-custom-text-100" : ""
                              } ${selected ? "text-custom-text-100" : ""}`
                            }
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                style={{
                                  backgroundColor: issue.state__color,
                                }}
                              />
                              <span className="flex-shrink-0 text-xs">
                                {issue.project__identifier}-{issue.sequence_id}
                              </span>{" "}
                              {issue.name}
                            </div>
                            <a
                              href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
                              target="_blank"
                              className="group-hover:block hidden relative z-1 text-custom-text-200 hover:text-custom-text-100"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <LaunchOutlined
                                sx={{
                                  fontSize: 16,
                                }}
                              />
                            </a>
                          </Combobox.Option>
                        ))}
                      </ul>
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
