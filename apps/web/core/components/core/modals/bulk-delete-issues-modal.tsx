/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Combobox, ComboboxList, ComboboxSearch } from "@makeplane/propel/components/combobox";
import { Dialog, DialogActions, DialogContent, DialogMain, DialogTitle } from "@makeplane/propel/components/dialog";
import { setToast } from "@plane/blocks/toast";
import type { ISearchIssueResponse, IUser } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { Loader } from "@plane/blocks/skeleton";
// assets
import darkIssuesAsset from "@/app/assets/empty-state/search/issues-dark.webp?url";
import lightIssuesAsset from "@/app/assets/empty-state/search/issues-light.webp?url";
import darkSearchAsset from "@/app/assets/empty-state/search/search-dark.webp?url";
import lightSearchAsset from "@/app/assets/empty-state/search/search-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import useDebounce from "@/hooks/use-debounce";
// services
import { ProjectService } from "@/services/project";
// local components
import { BulkDeleteIssuesModalItem } from "./bulk-delete-issues-modal-item";

type FormInput = {
  delete_issue_ids: string[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: IUser | undefined;
};

const projectService = new ProjectService();

export const BulkDeleteIssuesModal = observer(function BulkDeleteIssuesModal(props: Props) {
  const { isOpen, onClose } = props;
  // router params
  const { workspaceSlug, projectId } = useParams();
  // states
  const [query, setQuery] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // theme hook
  const { resolvedTheme } = useTheme();
  // hooks
  const {
    issues: { removeBulkIssues },
  } = useIssues(EIssuesStoreType.PROJECT);
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

  const {
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormInput>({
    defaultValues: {
      delete_issue_ids: [],
    },
  });

  const handleClose = () => {
    setQuery("");
    reset();
    onClose();
  };

  const handleDelete: SubmitHandler<FormInput> = async (data) => {
    if (!workspaceSlug || !projectId) return;

    if (!data.delete_issue_ids || data.delete_issue_ids.length === 0) {
      setToast({
        type: "error",
        title: "Error!",
        message: "Please select at least one work item.",
      });
      return;
    }

    if (!Array.isArray(data.delete_issue_ids)) data.delete_issue_ids = [data.delete_issue_ids];

    await removeBulkIssues(workspaceSlug, projectId, data.delete_issue_ids)
      .then(() => {
        setToast({
          type: "success",
          title: "Success!",
          message: "Work items deleted successfully!",
        });
        handleClose();
      })
      .catch(() =>
        setToast({
          type: "error",
          title: "Error!",
          message: "Something went wrong. Please try again.",
        })
      );
  };

  const issueList =
    issues.length > 0 ? (
      <div className="p-2">
        {query === "" && (
          <h2 className="mt-4 mb-2 px-3 text-11 font-semibold text-primary">Select work items to delete</h2>
        )}
        <ComboboxList aria-label={t("power_k.actions_commands.bulk_delete_work_items")}>
          {issues.map((issue) => (
            <BulkDeleteIssuesModalItem issue={issue} key={issue.id} />
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
        {/* The search field is the only visible chrome, so the dialog's accessible name is carried
            by a visually hidden title. */}
        <div className="sr-only">
          <DialogTitle>{t("power_k.actions_commands.bulk_delete_work_items")}</DialogTitle>
        </div>
        <form className="flex min-h-0 flex-1 flex-col">
          {/* `inline` + `open` renders the list in place: the dialog is the surface, so there is no
              popup positioner. */}
          <Combobox<string, true>
            inline
            multiple
            // Bound to the dialog so the combobox resets its transient state when the modal closes.
            open={isOpen}
            onOpenChange={(open) => {
              if (!open) handleClose();
            }}
            value={watch("delete_issue_ids")}
            onValueChange={(ids) => setValue("delete_issue_ids", ids)}
            inputValue={query}
            onInputValueChange={(next, details) => {
              // Base UI clears the query after every pick in multiple mode; letting that through
              // would re-run the debounced server search on each toggle.
              if (details.reason === "input-clear") return;
              setQuery(next);
            }}
          >
            <ComboboxSearch
              placeholder={t("common.search.placeholder")}
              aria-label={t("power_k.actions_commands.bulk_delete_work_items")}
            />
            <DialogMain>
              <div className="max-h-80 scroll-py-2 overflow-x-hidden overflow-y-auto overscroll-contain">
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
              </div>
            </DialogMain>
          </Combobox>
          {issues.length > 0 && (
            <DialogActions>
              <Button variant="secondary" size="md" stretch="auto" label="Cancel" onClick={handleClose} />
              <Button
                variant="danger"
                size="md"
                stretch="auto"
                label={isSubmitting ? "Deleting..." : "Delete selected work items"}
                onClick={() => void handleSubmit(handleDelete)()}
                loading={isSubmitting}
              />
            </DialogActions>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
});
