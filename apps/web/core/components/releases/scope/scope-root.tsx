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

import { lazy, Suspense } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import type { FC } from "react";
// plane imports
import { Button } from "@plane/propel/button";
import { useTranslation } from "@plane/i18n";
import { PlusIcon } from "@plane/propel/icons";
import { EIssuesStoreType } from "@plane/types";
import type { TIssue } from "@plane/types";
// components
import { BaseListRoot } from "@/components/issues/issue-layouts/list/base-list-root";
// hooks
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useReleases } from "@/hooks/store/use-releases";
import { useIssues } from "@/hooks/store/use-issues";
// local imports
import { ReleaseScopeQuickActions } from "./release-scope-quick-actions";

const WorkItemPeekOverview = lazy(() =>
  import("@/components/issues/peek-overview/root").then((module) => ({ default: module.IssuePeekOverview }))
);

/** Uses BaseListRoot with RELEASE store for list; layout structure mirrors issue list roots. */

const ReleaseScopeListRoot: FC = observer(function ReleaseScopeListRoot() {
  // router
  const { releaseId, workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { release: releaseStore } = useReleases();
  const { permissions } = useIssues();
  // derived values
  const release = releaseId ? releaseStore.getReleaseById(releaseId) : undefined;

  const openAddWorkItems = () => releaseId && releaseStore.openAddWorkItemsModal(releaseId);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center px-6 py-3 border-b border-subtle">
          <div className="text-16 font-medium text-primary">{t("releases.scope")}</div>
          {release?.canEdit && (
            <Button variant="secondary" size="lg" onClick={openAddWorkItems}>
              <PlusIcon className="size-4" />
              {t("releases.scope_page.add_work_items") ?? "Add work items"}
            </Button>
          )}
        </div>
        <div className="relative size-full min-h-0 flex-1">
          <BaseListRoot
            QuickActions={ReleaseScopeQuickActions}
            viewId={releaseId}
            layoutPermissions={{
              canCreateWorkItem: {
                viaHeader: false,
                viaQuickAdd: false,
              },
              canPerformBulkOps: false,
            }}
            getWorkItemPermissions={(workItem: TIssue) => {
              return {
                canEditProperty: (property) =>
                  workspaceSlug && workItem.project_id && release?.canEdit
                    ? permissions.getCanEditProperty(workspaceSlug, workItem.project_id, workItem.id, property)
                    : false,
                canDragAndDrop: false,
              };
            }}
          />
        </div>
      </div>
    </div>
  );
});

export const ReleaseScopeRoot = observer(function ReleaseScopeRoot() {
  const { workspaceSlug, releaseId } = useParams<{ workspaceSlug: string; releaseId: string }>();

  if (!workspaceSlug || !releaseId) return null;

  return (
    <div className="flex flex-1 h-full relative overflow-hidden">
      <div className="relative flex size-full flex-col overflow-hidden">
        <div className="relative flex-1 overflow-hidden">
          <IssuesStoreContext.Provider value={EIssuesStoreType.RELEASE}>
            <ReleaseScopeListRoot />
          </IssuesStoreContext.Provider>
        </div>
        <Suspense>
          <WorkItemPeekOverview />
        </Suspense>
      </div>
    </div>
  );
});
