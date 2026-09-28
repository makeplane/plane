/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState, useRef } from "react";
import { Combobox, ComboboxItem, ComboboxList, ComboboxSearch } from "@makeplane/propel/components/combobox";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogInfo,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { CloseOutline, RocketOutline } from "@makeplane/propel/icons";
// i18n
import { useTranslation } from "@plane/i18n";
// types
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { ISearchIssueResponse, TProjectIssuesSearchParams } from "@plane/types";
// ui
import { Switch } from "@makeplane/propel/components/switch";
import { Loader } from "@plane/blocks/skeleton";
import { generateWorkItemLink, getTabIndex } from "@plane/utils";
// helpers
// hooks
import useDebounce from "@/hooks/use-debounce";
import { usePlatformOS } from "@/hooks/use-platform-os";
// services
import { ProjectService } from "@/services/project";
// components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { IssueSearchModalEmptyState } from "./issue-search-modal-empty-state";

type Props = {
  workspaceSlug: string | undefined;
  projectId?: string;
  isOpen: boolean;
  handleClose: () => void;
  searchParams: Partial<TProjectIssuesSearchParams>;
  handleOnSubmit: (data: ISearchIssueResponse[]) => Promise<void>;
  workspaceLevelToggle?: boolean;
  shouldHideIssue?: (issue: ISearchIssueResponse) => boolean;
  selectedWorkItemIds?: string[];
  workItemSearchServiceCallback?: (params: TProjectIssuesSearchParams) => Promise<ISearchIssueResponse[]>;
};

const projectService = new ProjectService();

export function ExistingIssuesListModal(props: Props) {
  const { t } = useTranslation();

  const {
    workspaceSlug,
    projectId,
    isOpen,
    handleClose: onClose,
    searchParams,
    handleOnSubmit,
    workspaceLevelToggle = false,
    shouldHideIssue,
    selectedWorkItemIds,
    workItemSearchServiceCallback,
  } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);
  const { isMobile } = usePlatformOS();
  const debouncedSearchTerm: string = useDebounce(searchTerm, 500);
  const { baseTabIndex } = getTabIndex(undefined, isMobile);
  const hasInitializedSelection = useRef(false);

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setSelectedIssues([]);
    setIsWorkspaceLevel(false);
    hasInitializedSelection.current = false;
  };

  const onSubmit = async () => {
    if (selectedIssues.length === 0) {
      setToast({
        type: "error",
        title: t("toast.error"),
        message: t("issue.select.error"),
      });

      return;
    }

    setIsSubmitting(true);

    await handleOnSubmit(selectedIssues).finally(() => setIsSubmitting(false));

    handleClose();
  };

  const handleSearch = () => {
    if (!isOpen || !workspaceSlug) return;
    setIsLoading(true);
    const searchService =
      workItemSearchServiceCallback ??
      (projectId
        ? projectService.projectIssuesSearch.bind(projectService, workspaceSlug?.toString(), projectId?.toString())
        : undefined);
    if (!searchService) return;
    searchService({
      search: debouncedSearchTerm,
      ...searchParams,
      workspace_search: isWorkspaceLevel,
    })
      .then((res) => setIssues(res))
      .finally(() => {
        setIsSearching(false);
        setIsLoading(false);
      });
  };

  const handleSelectIssues = () => {
    setSelectedIssues((prevData) => (prevData.length === filteredIssues.length ? [] : [...filteredIssues]));
  };

  useEffect(() => {
    if (isOpen && !hasInitializedSelection.current && selectedWorkItemIds && issues.length > 0) {
      setSelectedIssues(issues.filter((issue) => selectedWorkItemIds.includes(issue.id)));
      hasInitializedSelection.current = true;
    }
  }, [isOpen, issues, selectedWorkItemIds]);

  useEffect(() => {
    handleSearch();
  }, [debouncedSearchTerm, isOpen, isWorkspaceLevel, projectId, workspaceSlug]);

  const filteredIssues = issues.filter((issue) => !shouldHideIssue?.(issue));

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="md">
        {/* The search field is the only visible chrome, so the dialog's accessible name is carried
            by a visually hidden title. */}
        <div className="sr-only">
          <DialogTitle>{t("issue.add.existing")}</DialogTitle>
        </div>
        {/* `inline` + `open` renders the list in place: the dialog is the surface, so there is no
            popup positioner. */}
        <Combobox<ISearchIssueResponse, true>
          inline
          multiple
          // Bound to the dialog so the combobox resets its transient state when the modal closes.
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
          value={selectedIssues}
          onValueChange={(next) => setSelectedIssues(next)}
          // Re-searching returns fresh objects, so rows are matched to the selection by id.
          isItemEqualToValue={(itemValue, value) => itemValue.id === value.id}
          itemToStringLabel={(issue) => issue.name}
          inputValue={searchTerm}
          onInputValueChange={(next, details) => {
            // Base UI clears the query after every pick in multiple mode; letting that through
            // would re-run the debounced server search on each toggle.
            if (details.reason === "input-clear") return;
            setSearchTerm(next);
          }}
        >
          <ComboboxSearch
            placeholder={t("common.search.placeholder")}
            aria-label={t("issue.add.existing")}
            tabIndex={baseTabIndex}
          />
          <DialogMain>
            <div className="flex flex-shrink-0 flex-col-reverse gap-4 text-13 text-secondary sm:flex-row sm:items-center sm:justify-between">
              {selectedIssues.length > 0 ? (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {selectedIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-center gap-1 rounded-md border border-subtle bg-layer-1 py-1 pl-2 text-11 whitespace-nowrap text-primary"
                    >
                      <IssueIdentifier
                        projectId={issue.project_id}
                        issueTypeId={issue.type_id}
                        projectIdentifier={issue.project__identifier}
                        issueSequenceId={issue.sequence_id}
                        size="xs"
                        variant="secondary"
                      />
                      <button
                        type="button"
                        className="group p-1"
                        onClick={() => setSelectedIssues((prevData) => prevData.filter((i) => i.id !== issue.id))}
                      >
                        <CloseOutline className="h-3 w-3 text-secondary group-hover:text-primary" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-min rounded-md border border-subtle bg-layer-1 p-2 text-11 whitespace-nowrap">
                  {t("issue.select.empty")}
                </div>
              )}
              {workspaceLevelToggle && (
                <Tooltip label="Toggle workspace level search" disabled={isMobile}>
                  <div
                    className={`flex flex-shrink-0 cursor-pointer items-center gap-1 text-11 ${
                      isWorkspaceLevel ? "text-primary" : "text-secondary"
                    }`}
                  >
                    <Switch
                      size="sm"
                      checked={isWorkspaceLevel}
                      onCheckedChange={setIsWorkspaceLevel}
                      aria-label={t("common.workspace_level")}
                    />
                    <button
                      type="button"
                      onClick={() => setIsWorkspaceLevel((prevData) => !prevData)}
                      className="flex-shrink-0"
                    >
                      {t("common.workspace_level")}
                    </button>
                  </div>
                </Tooltip>
              )}
            </div>

            <div className="vertical-scrollbar scrollbar-md max-h-80 min-h-0 scroll-py-2 overflow-x-hidden overflow-y-auto overscroll-contain">
              {/* TODO: Translate here */}
              {searchTerm !== "" && (
                <h5 className="text-13 text-secondary">
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
                  {filteredIssues.length === 0 ? (
                    <IssueSearchModalEmptyState
                      debouncedSearchTerm={debouncedSearchTerm}
                      isSearching={isSearching}
                      issues={filteredIssues}
                      searchTerm={searchTerm}
                    />
                  ) : (
                    <ComboboxList aria-label={t("issue.add.existing")}>
                      {filteredIssues.map((issue) => (
                        // `selection="checkbox"` replaces the hand-placed checkbox and the
                        // `as="label"` wrapper the old row needed to make it clickable.
                        <ComboboxItem
                          key={issue.id}
                          value={issue}
                          selection="checkbox"
                          label={issue.name}
                          icon={
                            <span className="flex flex-shrink-0 items-center gap-2">
                              <span
                                className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
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
                                workspaceSlug,
                                projectId: issue?.project_id,
                                issueId: issue?.id,
                                projectIdentifier: issue.project__identifier,
                                sequenceId: issue?.sequence_id,
                              })}
                              target="_blank"
                              className="relative z-1 hidden flex-shrink-0 text-secondary group-hover/item:block hover:text-primary"
                              rel="noopener noreferrer"
                              aria-label={t("common.actions.open_in_new_tab")}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <RocketOutline className="h-4 w-4" />
                            </a>
                          }
                        />
                      ))}
                    </ComboboxList>
                  )}
                </>
              )}
            </div>
          </DialogMain>
        </Combobox>
        <DialogActions>
          <DialogInfo>
            <Button
              variant="ghost"
              size="sm"
              stretch="auto"
              label={
                selectedIssues.length === issues.length ? t("issue.select.deselect_all") : t("issue.select.select_all")
              }
              onClick={handleSelectIssues}
              disabled={filteredIssues.length === 0}
            />
          </DialogInfo>
          <Button variant="secondary" size="md" stretch="auto" label={t("common.cancel")} onClick={handleClose} />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={isSubmitting ? t("common.adding") : t("issue.select.add_selected")}
            onClick={onSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || selectedIssues.length === 0}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
