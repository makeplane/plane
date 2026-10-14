/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Combobox, ComboboxItem, ComboboxList, ComboboxSearch } from "@makeplane/propel/components/combobox";
import { Dialog, DialogContent, DialogMain } from "@makeplane/propel/components/dialog";
import { setToast } from "@plane/blocks/toast";
import type { ISearchIssueResponse } from "@plane/types";
import { Loader } from "@plane/blocks/skeleton";
// assets
import darkIssuesAsset from "@/app/assets/empty-state/search/issues-dark.webp?url";
import lightIssuesAsset from "@/app/assets/empty-state/search/issues-light.webp?url";
import darkSearchAsset from "@/app/assets/empty-state/search/search-dark.webp?url";
import lightSearchAsset from "@/app/assets/empty-state/search/search-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useProject } from "@/hooks/store/use-project";
import useDebounce from "@/hooks/use-debounce";
// services
import { ProjectService } from "@/services/project";

type Props = {
  isOpen: boolean;
  value?: string | null;
  onClose: () => void;
  onSubmit: (issueId: string) => void;
};

const projectService = new ProjectService();

export function SelectDuplicateInboxIssueModal(props: Props) {
  const { isOpen, onClose, onSubmit, value } = props;
  // router
  const { workspaceSlug, projectId, issueId } = useParams();
  // states
  const [query, setQuery] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // theme hook
  const { resolvedTheme } = useTheme();
  // hooks
  const { getProjectById } = useProject();
  const { t } = useTranslation();
  // derived values
  const debouncedSearchTerm: string = useDebounce(query, 500);
  const searchResolvedPath = resolvedTheme === "light" ? lightSearchAsset : darkSearchAsset;
  const issuesResolvedPath = resolvedTheme === "light" ? lightIssuesAsset : darkIssuesAsset;

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
    setQuery("");
  };

  const handleSubmit = (selectedItem: string) => {
    if (!selectedItem || selectedItem.length === 0)
      return setToast({
        title: "Error",
        type: "error",
      });
    onSubmit(selectedItem);
    handleClose();
  };

  const issueList =
    filteredIssues.length > 0 ? (
      <div>
        {query === "" && <h2 className="mb-2 text-11 font-semibold text-primary">Select work item</h2>}
        <ComboboxList aria-label={t("inbox_issue.actions.mark_as_duplicate")}>
          {filteredIssues.map((issue) => (
            <ComboboxItem
              key={issue.id}
              value={issue.id}
              label={issue.name}
              icon={
                <span className="flex flex-shrink-0 items-center gap-2">
                  <span
                    className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: issue.state__color || "",
                    }}
                  />
                  <span className="flex-shrink-0 text-11 text-secondary">
                    {getProjectById(issue?.project_id)?.identifier}-{issue.sequence_id}
                  </span>
                </span>
              }
            />
          ))}
        </ComboboxList>
      </div>
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="md">
        {/* `inline` renders the list in place (the dialog is the surface) instead of in a popup
            positioner. Values are work item ids, so the selection is id-first (Ruling 46). */}
        <Combobox<string>
          inline
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
          value={value ?? null}
          onValueChange={(next) => {
            if (next) handleSubmit(next);
          }}
          inputValue={query}
          onInputValueChange={(next, details) => {
            // Base UI clears the query itself after a pick; letting that through would re-run the
            // debounced server search.
            if (details.reason === "input-clear") return;
            setQuery(next);
          }}
        >
          <ComboboxSearch placeholder={t("common.search.placeholder")} />
          <DialogMain>
            <div className="max-h-80 scroll-py-2 divide-y divide-subtle-1 overflow-x-hidden overflow-y-auto overscroll-contain">
              {isSearching ? (
                <Loader className="space-y-3 p-3">
                  <Loader.Item height="40px" />
                  <Loader.Item height="40px" />
                  <Loader.Item height="40px" />
                  <Loader.Item height="40px" />
                </Loader>
              ) : (
                issueList
              )}
            </div>
          </DialogMain>
        </Combobox>
      </DialogContent>
    </Dialog>
  );
}
