/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
// headless ui
import { Combobox } from "@headlessui/react";
// i18n
import { useTranslation } from "@plane/i18n";
import { SearchIcon } from "@plane/propel/icons";
// types
import type { ISearchIssueResponse } from "@plane/types";
// ui
import { Loader, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { getTabIndex } from "@plane/utils";
// components
import { IssueSearchModalEmptyState } from "@/components/core/modals/issue-search-modal-empty-state";
// helpers
// hooks
import useDebounce from "@/hooks/use-debounce";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
// plane web types
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// services
import { ProjectService } from "@/services/project";
import { ParentIssuesListItem } from "./parent-issues-list-item";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  value?: any;
  onChange: (issue: ISearchIssueResponse) => void;
  projectId: string | undefined;
  issueId?: string;
  searchEpic?: boolean;
  convertToWorkItem?: boolean;
};

// services
const projectService = new ProjectService();

export function ParentIssuesListModal({
  isOpen,
  handleClose: onClose,
  value,
  onChange,
  projectId,
  issueId,
  searchEpic = false,
  convertToWorkItem = false,
}: Props) {
  // i18n
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { isMobile } = usePlatformOS();
  const debouncedSearchTerm: string = useDebounce(searchTerm, 500);

  const { workspaceSlug } = useParams();

  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const isCrossProjectEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_CROSS_PROJECT_SUB_WORK_ITEMS_ENABLED);

  const { baseTabIndex } = getTabIndex(undefined, isMobile);

  const handleClose = () => {
    onClose();
    setSearchTerm("");
  };

  useEffect(() => {
    if (!isOpen || !workspaceSlug || !projectId) return;

    setIsSearching(true);
    setIsLoading(true);

    projectService
      .projectIssuesSearch(workspaceSlug, projectId, {
        search: debouncedSearchTerm,
        parent: searchEpic ? undefined : true,
        issue_id: issueId,
        workspace_search: isCrossProjectEnabled,
        epic: searchEpic && !convertToWorkItem ? true : undefined,
        convert: convertToWorkItem ? true : undefined,
      })
      .then((res) => setIssues(res))
      .finally(() => {
        setIsSearching(false);
        setIsLoading(false);
      });
  }, [debouncedSearchTerm, isOpen, issueId, projectId, workspaceSlug, convertToWorkItem, searchEpic]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <Combobox
        value={value}
        onChange={(val) => {
          onChange(val);
          handleClose();
        }}
      >
        <div className="relative m-1">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-primary text-opacity-40"
            aria-hidden="true"
          />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-primary outline-none placeholder:text-placeholder focus:ring-0 sm:text-13"
            placeholder={t("common.search.placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            displayValue={() => ""}
            tabIndex={baseTabIndex}
          />
        </div>
        <Combobox.Options static className="max-h-80 scroll-py-2 overflow-y-auto vertical-scrollbar scrollbar-md">
          {searchTerm !== "" && (
            <h5 className="mx-2 text-13 text-secondary">
              Search results for{" "}
              <span className="text-primary">
                {'"'}
                {searchTerm}
                {'"'}
              </span>{" "}
              {isCrossProjectEnabled ? "in workspace:" : "in project:"}
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
                <ul className={`text-13 ${issues.length > 0 ? "p-2" : ""}`}>
                  {issues.map((issue) => (
                    <Combobox.Option
                      key={issue.id}
                      value={issue}
                      className={({ active, selected }) =>
                        `group flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 my-0.5 text-secondary ${
                          active ? "bg-layer-1 text-primary" : ""
                        } ${selected ? "text-primary" : ""}`
                      }
                    >
                      <ParentIssuesListItem workspaceSlug={workspaceSlug?.toString()} issue={issue} />
                    </Combobox.Option>
                  ))}
                </ul>
              )}
            </>
          )}
        </Combobox.Options>
      </Combobox>
    </ModalCore>
  );
}
