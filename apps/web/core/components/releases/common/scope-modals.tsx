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

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EIssuesStoreType } from "@plane/types";
import type { ReleaseSearchIssueResponse } from "@plane/types";
import { ReleaseWorkItemsListModal } from "@/components/releases/common/release-work-items-list-modal";
import { useIssues } from "@/hooks/store/use-issues";
import { useReleases } from "@/hooks/store/use-releases";

type ReleaseScopeModalsProps = {
  workspaceSlug: string;
  releaseId: string;
};

export const ReleaseScopeModals = observer(function ReleaseScopeModals(props: ReleaseScopeModalsProps) {
  const { workspaceSlug, releaseId } = props;
  const { t } = useTranslation();
  const { release: releaseStore } = useReleases();
  const { issues } = useIssues(EIssuesStoreType.RELEASE);

  const isAddWorkItemsOpen = releaseStore.addWorkItemsModalReleaseId === releaseId;

  const handleAddWorkItems = async (_newItems: ReleaseSearchIssueResponse[], workItemIds: string[]) => {
    try {
      await releaseStore.addWorkItemsToRelease(workspaceSlug, releaseId, workItemIds);
      releaseStore.closeAddWorkItemsModal();
      await issues.fetchIssues(workspaceSlug, releaseId, "mutation", { canGroup: true, perPageCount: 50 });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("releases.toast.work_items_added", { count: workItemIds.length }) ?? "Work items added",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("releases.toast.work_items_error") ?? "Failed to add work items",
      });
    }
  };

  return (
    <ReleaseWorkItemsListModal
      workspaceSlug={workspaceSlug}
      releaseId={releaseId}
      isOpen={isAddWorkItemsOpen}
      handleClose={() => releaseStore.closeAddWorkItemsModal()}
      searchParams={{}}
      handleOnSubmit={async (data) =>
        handleAddWorkItems(
          data,
          data.map((i) => i.id)
        )
      }
    />
  );
});
