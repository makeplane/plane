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

import { Fragment, useCallback, useMemo, useState } from "react";
import { MoveDown } from "lucide-react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TValidateLevelChangePayload, TValidateLevelChangeResponse } from "@plane/types";
import { Loader } from "@plane/ui";
// plane web imports
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useWorkspaceWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-workspace-work-item-types";
// local imports
import {
  hierarchyGroupingFingerprint,
  useWorkItemTypeHierarchyLocalState,
  WorkItemTypeHierarchyLocalStateProvider,
} from "./hierarchy-local-state-context";
import { WorkItemTypeHierarchyLevelItem } from "./level-item";
import { WorkItemTypeHierarchyMaxLevel } from "./max-level";
import { WorkItemTypeHierarchyValidationChangeErrorModal } from "./validation-change-error-modal";

type WorkItemTypeHierarchyLevelsBodyProps = {
  canAddLevel: boolean;
  defaultLevel: number;
  workspaceSlug: string;
};

const WorkItemTypeHierarchyLevelsBody = observer(function WorkItemTypeHierarchyLevelsBody({
  canAddLevel,
  defaultLevel,
  workspaceSlug,
}: WorkItemTypeHierarchyLevelsBodyProps) {
  // states
  const [isSaving, setIsSaving] = useState(false);
  const [updatedLevels, setUpdatedLevels] = useState<TValidateLevelChangePayload | null>(null);
  const [violations, setViolations] = useState<TValidateLevelChangeResponse | null>(null);
  // translation
  const { t } = useTranslation();
  // local drag context
  const { localWorkItemTypesByLevel, hasPendingHierarchyChanges, discardHierarchyChanges, saveHierarchyChanges } =
    useWorkItemTypeHierarchyLocalState();
  // derived values
  const workItemTypesByLevel = localWorkItemTypesByLevel;
  const maxLevel = workItemTypesByLevel.size > 0 ? Math.max(...workItemTypesByLevel.keys()) : -1;
  // handlers
  const handleModalClose = useCallback(() => {
    setUpdatedLevels(null);
    setViolations(null);
  }, []);
  const handleSaveChanges = useCallback(async () => {
    setIsSaving(true);
    await saveHierarchyChanges({
      onValidationChangeViolation: (updatedLevels, violations) => {
        setUpdatedLevels(updatedLevels);
        setViolations(violations);
      },
    });
    setIsSaving(false);
  }, [saveHierarchyChanges]);

  return (
    <>
      <WorkItemTypeHierarchyValidationChangeErrorModal
        updatedLevels={updatedLevels}
        violations={violations}
        isOpen={!!updatedLevels && !!violations}
        onClose={handleModalClose}
        onSuccess={handleSaveChanges}
        workspaceSlug={workspaceSlug}
      />
      <div className="bg-surface-2 rounded-2xl p-4">
        {canAddLevel && (
          <>
            <WorkItemTypeHierarchyMaxLevel level={maxLevel + 1} />
            <div className="h-8 py-1 pl-4">
              <MoveDown className="size-6 text-tertiary stroke-1" />
            </div>
          </>
        )}
        {Array.from(workItemTypesByLevel.entries()).map(([level, workItemTypes], index) => (
          <Fragment key={level}>
            {index > 0 && (
              <div className="h-8 py-1 pl-4">
                <MoveDown className="size-6 text-tertiary stroke-1" />
              </div>
            )}
            <WorkItemTypeHierarchyLevelItem defaultLevel={defaultLevel} level={level} workItemTypes={workItemTypes} />
          </Fragment>
        ))}
        {hasPendingHierarchyChanges && (
          <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-4 border-t border-subtle">
            <Button type="button" variant="secondary" size="lg" onClick={discardHierarchyChanges}>
              {t("common.discard")}
            </Button>
            <Button type="button" variant="primary" size="lg" onClick={handleSaveChanges} loading={isSaving}>
              {t("work_item_type_hierarchy.levels.pending_changes.save")}
            </Button>
          </div>
        )}
      </div>
    </>
  );
});

type WorkItemTypeHierarchyLevelsRootProps = {
  workspaceSlug: string;
};

export const WorkItemTypeHierarchyLevelsRoot = observer(function WorkItemTypeHierarchyLevelsRoot({
  workspaceSlug,
}: WorkItemTypeHierarchyLevelsRootProps) {
  // store hooks
  const { canCreate, getActiveWorkItemTypesByWorkspaceSlugGroupedByLevel, getLoaderByWorkspaceSlug } =
    useWorkspaceWorkItemTypes();
  const { featuresByWorkspaceSlug } = useWorkspaceFeatures();
  // derived values
  const storeWorkItemTypesByLevel = getActiveWorkItemTypesByWorkspaceSlugGroupedByLevel(workspaceSlug);
  const storeFingerprint = useMemo(
    () => hierarchyGroupingFingerprint(storeWorkItemTypesByLevel),
    [storeWorkItemTypesByLevel]
  );
  const isLoading = getLoaderByWorkspaceSlug(workspaceSlug) === "init-loader";
  const canAddLevel = canCreate(workspaceSlug);
  const defaultLevel = workspaceSlug ? (featuresByWorkspaceSlug(workspaceSlug)?.work_item_type_default_level ?? 0) : 0;

  if (isLoading)
    return (
      <Loader className="w-full flex flex-col gap-4">
        <Loader.Item height="56px" width="100%" />
        <Loader.Item height="56px" width="100%" />
        <Loader.Item height="56px" width="100%" />
        <Loader.Item height="56px" width="100%" />
      </Loader>
    );

  return (
    <WorkItemTypeHierarchyLocalStateProvider
      storeFingerprint={storeFingerprint}
      storeGroupedByLevel={storeWorkItemTypesByLevel}
      workspaceSlug={workspaceSlug}
    >
      <WorkItemTypeHierarchyLevelsBody
        canAddLevel={canAddLevel}
        defaultLevel={defaultLevel}
        workspaceSlug={workspaceSlug}
      />
    </WorkItemTypeHierarchyLocalStateProvider>
  );
});
