/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
// icons
import { RocketOutline } from "@makeplane/propel/icons";
// propel
import { Combobox, ComboboxItem, ComboboxList, ComboboxSearch } from "@makeplane/propel/components/combobox";
import { Dialog, DialogContent, DialogMain, DialogTitle } from "@makeplane/propel/components/dialog";
// i18n
import { useTranslation } from "@plane/i18n";
// types
import type { ISearchIssueResponse } from "@plane/types";
// ui
import { Loader } from "@plane/blocks/skeleton";
import { generateWorkItemLink, getTabIndex } from "@plane/utils";
// components
import { IssueSearchModalEmptyState } from "@/components/core/modals/issue-search-modal-empty-state";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// hooks
import useDebounce from "@/hooks/use-debounce";
import { usePlatformOS } from "@/hooks/use-platform-os";
// services
import { ProjectService } from "@/services/project";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  value?: any;
  onChange: (issue: ISearchIssueResponse) => void;
  projectId: string | undefined;
  issueId?: string;
  searchEpic?: boolean;
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

  const { baseTabIndex } = getTabIndex(undefined, isMobile);
  // derived values
  const selectedIssueId = typeof value?.id === "string" ? value.id : null;

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
        workspace_search: false,
        epic: searchEpic ? true : undefined,
      })
      .then((res) => setIssues(res))
      .finally(() => {
        setIsSearching(false);
        setIsLoading(false);
      });
  }, [debouncedSearchTerm, isOpen, issueId, projectId, searchEpic, workspaceSlug]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="md">
        {/* The search field is the only visible chrome, so the dialog's accessible name is carried by a visually hidden title. */}
        <div className="sr-only">
          <DialogTitle>{t("issue.add.parent")}</DialogTitle>
        </div>
        <Combobox<string, false>
          inline
          open={isOpen}
          items={issues}
          filter={null}
          inputValue={searchTerm}
          onInputValueChange={(next, details) => {
            // Base UI also reports its own clears (on item press, on close); only a keystroke
            // should move the server-side search.
            if (details.reason !== "input-change") return;
            setSearchTerm(next);
          }}
          value={selectedIssueId}
          onValueChange={(id) => {
            const issue = issues.find((item) => item.id === id);
            if (!issue) return;
            onChange(issue);
            handleClose();
          }}
        >
          <ComboboxSearch placeholder={t("common.search.placeholder")} tabIndex={baseTabIndex} />
          <DialogMain>
            <div className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-x-hidden overflow-y-auto overscroll-contain">
              {searchTerm !== "" && (
                <h5 className="mx-2 text-13 text-secondary">
                  Search results for{" "}
                  <span className="text-primary">
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
                    <ComboboxList aria-label={t("common.search.placeholder")}>
                      {(issue: ISearchIssueResponse, index: number) => (
                        <ComboboxItem
                          key={issue.id}
                          value={issue.id}
                          index={index}
                          label={issue.name}
                          icon={
                            <span className="flex shrink-0 items-center gap-2">
                              <span
                                className="block h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: issue.state__color,
                                }}
                              />
                              <IssueIdentifier
                                projectId={issue.project_id}
                                issueTypeId={issue.type_id}
                                projectIdentifier={issue.project__identifier}
                                issueSequenceId={issue.sequence_id}
                                size="xs"
                                variant="secondary"
                              />
                            </span>
                          }
                          trailing={
                            <a
                              href={generateWorkItemLink({
                                workspaceSlug: workspaceSlug?.toString() ?? "",
                                projectId: issue?.project_id,
                                issueId: issue?.id,
                                projectIdentifier: issue.project__identifier,
                                sequenceId: issue?.sequence_id,
                              })}
                              target="_blank"
                              className="relative z-1 hidden shrink-0 text-secondary group-hover/item:block hover:text-primary"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <RocketOutline className="h-4 w-4" />
                            </a>
                          }
                        />
                      )}
                    </ComboboxList>
                  )}
                </>
              )}
            </div>
          </DialogMain>
        </Combobox>
      </DialogContent>
    </Dialog>
  );
}
