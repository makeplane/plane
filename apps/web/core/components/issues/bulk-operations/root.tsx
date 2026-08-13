/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { ArchiveIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EIssuesStoreType } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import { useUserPermissions } from "@/hooks/store/user";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

const BULK_ARCHIVE_CHUNK_SIZE = 100;

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
};

export const IssueBulkOperationsRoot = observer(function IssueBulkOperationsRoot(props: Props) {
  const { className, selectionHelpers } = props;
  const { workspaceSlug, projectId } = useParams();
  const [isArchiving, setIsArchiving] = useState(false);
  // store hooks
  const { isSelectionActive, selectedEntityIds, clearSelection } = useMultipleSelectStore();
  const {
    issues: { archiveBulkIssues },
  } = useIssues(EIssuesStoreType.PROJECT);
  const { allowPermissions } = useUserPermissions();
  // derived values
  const workspaceSlugValue = workspaceSlug?.toString();
  const projectIdValue = projectId?.toString();
  const canArchiveIssues = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlugValue,
    projectIdValue
  );

  const handleBulkArchive = async () => {
    if (!workspaceSlugValue || !projectIdValue || selectedEntityIds.length === 0) return;

    const selectedCount = selectedEntityIds.length;
    setIsArchiving(true);
    try {
      const issueIdChunks: string[][] = [];
      for (let start = 0; start < selectedEntityIds.length; start += BULK_ARCHIVE_CHUNK_SIZE)
        issueIdChunks.push(selectedEntityIds.slice(start, start + BULK_ARCHIVE_CHUNK_SIZE));

      await issueIdChunks.reduce(async (previousChunk, issueIdsChunk) => {
        await previousChunk;
        await archiveBulkIssues(workspaceSlugValue, projectIdValue, issueIdsChunk);
      }, Promise.resolve());
      clearSelection();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Archived",
        message: `${selectedCount} selected work item${selectedCount === 1 ? "" : "s"} archived.`,
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Bulk archive failed",
        message:
          "Only completed or cancelled work items can be archived. Earlier successful batches remain archived; the failed batch was not partially applied.",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  if (!isSelectionActive || selectionHelpers.isSelectionDisabled) return null;

  if (!canArchiveIssues) return null;

  return (
    <div className={cn("sticky bottom-0 left-0 z-[2] grid h-20 place-items-center px-3.5", className)}>
      <div className="shadow-sm flex h-14 w-full items-center justify-between gap-3 rounded-md border-[0.5px] border-subtle bg-surface-1 px-3.5 py-4">
        <p className="text-13 font-medium text-primary">
          {selectedEntityIds.length} selected loaded work item{selectedEntityIds.length === 1 ? "" : "s"}. Bulk archive
          runs in bounded batches of {BULK_ARCHIVE_CHUNK_SIZE}.
        </p>
        <Button
          variant="primary"
          size="sm"
          prependIcon={<ArchiveIcon className="size-3.5" aria-hidden="true" />}
          loading={isArchiving}
          disabled={isArchiving}
          onClick={handleBulkArchive}
        >
          {isArchiving ? "Archiving..." : "Archive selected"}
        </Button>
      </div>
    </div>
  );
});
