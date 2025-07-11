"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
import { Combobox, Dialog, Transition } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ISearchIssueResponse } from "@plane/types";
import { Loader, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { SimpleEmptyState } from "@/components/empty-state";
// hooks
import { useProject } from "@/hooks/store";
import useDebounce from "@/hooks/use-debounce";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// services
import { ProjectService } from "@/services/project";

type Props = {
  isOpen: boolean;
  value?: string | null;
  onClose: () => void;
  onSubmit: (issueId: string) => void;
};

const projectService = new ProjectService();

export const SelectDuplicateInboxIssueModal: React.FC<Props> = (props) => {
  const { isOpen, onClose, onSubmit, value } = props;
  // router
  const { workspaceSlug, projectId, issueId } = useParams();
  // states
  const [query, setQuery] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // hooks
  const { getProjectById } = useProject();
  const { t } = useTranslation();
  // derived values
  const debouncedSearchTerm: string = useDebounce(query, 500);
  const searchResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/search/search" });
  const issuesResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/search/issues" });

  useEffect(() => {
    if (!isOpen || !workspaceSlug || !projectId) return;

    setIsSearching(true);
    projectService
      .projectIssuesSearch(workspaceSlug.toString(), projectId.toString(), {
        search: debouncedSearchTerm,
        workspace_search: false,
      })
      .then((res: ISearchIssueResponse[]) => setIssues(res))
      .finally(() => setIsSearching(false));
  }, [debouncedSearchTerm, isOpen, projectId, workspaceSlug]);

  const filteredIssues = issues.filter((issue) => issue.id !== issueId);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (selectedItem: string) => {
    if (!selectedItem || selectedItem.length === 0)
      return setToast({
        title: "Error",
        type: TOAST_TYPE.ERROR,
      });
    onSubmit(selectedItem);
    handleClose();
  };

  const issueList =
    filteredIssues.length > 0 ? (
      <li className="p-2">
        {query === "" && (
          <h2 className="mb-2 mt-4 px-3 text-xs font-semibold text-custom-text-100">Select work item</h2>
        )}
        <ul className="text-sm text-custom-text-100">
          {filteredIssues.map((issue) => {
            const stateColor = issue.state__color || "";

            return (
              <Combobox.Option
                key={issue.id}
                as="div"
                value={issue.id}
                className={({ active, selected }) =>
                  `flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-custom-text-200 ${
                    active || selected ? "bg-custom-background-80 text-custom-text-100" : ""
                  } `
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: stateColor,
                    }}
                  />
                  <span className="flex-shrink-0 text-xs text-custom-text-200">
                    {getProjectById(issue?.project_id)?.identifier}-{issue.sequence_id}
                  </span>
                  <span className="text-custom-text-200">{issue.name}</span>
                </div>
              </Combobox.Option>
            );
          })}
        </ul>
      </li>
    ) : (
      <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
        {query === "" ? (
          <SimpleEmptyState title={t("issue_relation.empty_state.no_issues.title")} assetPath={issuesResolvedPath} />
        ) : (
          <SimpleEmptyState title={t("issue_relation.empty_state.search.title")} assetPath={searchResolvedPath} />
        )}
      </div>
    );

  return (
    <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setQuery("")} appear>
      <div className="flex flex-wrap items-start">
        <div className="space-y-1 sm:basis-1/2">
          <Dialog as="div" className="relative z-30" onClose={handleClose}>
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

            <div className="fixed inset-0 z-30 overflow-y-auto p-4 sm:p-6 md:p-20">
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
                  <Combobox value={value} onChange={handleSubmit}>
                    <div className="relative m-1">
                      <Search
                        className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-custom-text-100 text-opacity-40"
                        aria-hidden="true"
                      />
                      <input
                        type="text"
                        className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-custom-text-100 outline-none focus:ring-0 sm:text-sm"
                        placeholder="Search..."
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>

                    <Combobox.Options
                      static
                      className="max-h-80 scroll-py-2 divide-y divide-custom-border-200 overflow-y-auto"
                    >
                      {isSearching ? (
                        <Loader className="space-y-3 p-3">
                          <Loader.Item height="40px" />
                          <Loader.Item height="40px" />
                          <Loader.Item height="40px" />
                          <Loader.Item height="40px" />
                        </Loader>
                      ) : (
                        <>{issueList}</>
                      )}
                    </Combobox.Options>
                  </Combobox>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </div>
      </div>
    </Transition.Root>
  );
};
