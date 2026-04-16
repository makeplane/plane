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

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
// plane imports
import type {
  BaseWorkItemTypeInstanceSchema,
  TValidateLevelChangePayload,
  TValidateLevelChangeResponse,
} from "@plane/types";
import { useTranslation } from "@plane/i18n";
import { dismissToast, setToast, TOAST_TYPE } from "@plane/propel/toast";
import { WorkspaceWorkItemTypesService } from "@plane/services";
// plane web imports
import { useWorkItemType } from "@/plane-web/hooks/store/work-item-types/use-work-item-type";
// services init
const workspaceWorkItemTypesService = new WorkspaceWorkItemTypesService();

export type WorkItemTypeHierarchyPendingLevelChange = {
  workItemType: BaseWorkItemTypeInstanceSchema;
  previousLevel: number;
  currentLevel: number;
};

function cloneGroupedByLevel(
  source: Map<number, BaseWorkItemTypeInstanceSchema[]>
): Map<number, BaseWorkItemTypeInstanceSchema[]> {
  const next = new Map<number, BaseWorkItemTypeInstanceSchema[]>();
  for (const [level, types] of source) {
    next.set(level, [...types]);
  }
  return next;
}

function buildTypeIdToOriginalLevelMap(source: Map<number, BaseWorkItemTypeInstanceSchema[]>): Map<string, number> {
  const map = new Map<string, number>();
  for (const [level, types] of source) {
    for (const t of types) {
      map.set(t.id, level);
    }
  }
  return map;
}

function moveTypeBetweenLevels(
  map: Map<number, BaseWorkItemTypeInstanceSchema[]>,
  workItemTypeId: string,
  sourceLevel: number,
  targetLevel: number
): Map<number, BaseWorkItemTypeInstanceSchema[]> {
  const next = cloneGroupedByLevel(map);
  const sourceArr = next.get(sourceLevel);
  if (!sourceArr) return next;
  const idx = sourceArr.findIndex((t) => t.id === workItemTypeId);
  if (idx === -1) return next;
  const [item] = sourceArr.splice(idx, 1);
  if (!item) return next;
  next.set(sourceLevel, [...sourceArr]);
  const targetArr = next.get(targetLevel) ?? [];
  next.set(targetLevel, [...targetArr, item]);
  return next;
}

/** Rebuild level keys from max level down to 0 so the UI matches store semantics. */
function normalizeHierarchyMap(
  map: Map<number, BaseWorkItemTypeInstanceSchema[]>
): Map<number, BaseWorkItemTypeInstanceSchema[]> {
  let max = -1;
  for (const [level, types] of map) {
    if (types.length > 0) max = Math.max(max, level);
  }
  if (max < 0) return new Map([[0, []]]);
  const result = new Map<number, BaseWorkItemTypeInstanceSchema[]>();
  for (let level = max; level >= 0; level--) {
    result.set(level, [...(map.get(level) ?? [])]);
  }
  return result;
}

/** Regroup types by each instance's `level` (e.g. after MobX updates from a successful save). */
function regroupByModelLevel(
  map: Map<number, BaseWorkItemTypeInstanceSchema[]>
): Map<number, BaseWorkItemTypeInstanceSchema[]> {
  const byLevel = new Map<number, BaseWorkItemTypeInstanceSchema[]>();
  for (const types of map.values()) {
    for (const t of types) {
      const level = t.level;
      const arr = byLevel.get(level) ?? [];
      arr.push(t);
      byLevel.set(level, arr);
    }
  }
  return normalizeHierarchyMap(byLevel);
}

export function hierarchyGroupingFingerprint(source: Map<number, BaseWorkItemTypeInstanceSchema[]>): string {
  const entries = [...source.entries()].sort((a, b) => a[0] - b[0]);
  return entries.map(([level, types]) => `${level}:${types.map((t) => t.id).join(",")}`).join("|");
}

type WorkItemTypeHierarchyLocalStateContextValue = {
  localWorkItemTypesByLevel: Map<number, BaseWorkItemTypeInstanceSchema[]>;
  /** Types whose draft level differs from the snapshot taken when the store last synced (empty when clean). */
  pendingLevelChanges: WorkItemTypeHierarchyPendingLevelChange[];
  hasPendingHierarchyChanges: boolean;
  isTypeModified: (workItemTypeId: string, currentLevel: number) => boolean;
  applyHierarchyDrop: (args: { workItemTypeId: string; sourceLevel: number; targetLevel: number }) => void;
  discardHierarchyChanges: () => void;
  saveHierarchyChanges: (args: {
    onValidationChangeViolation: (
      updatedLevels: TValidateLevelChangePayload,
      violations: TValidateLevelChangeResponse
    ) => void;
  }) => Promise<void>;
};

const WorkItemTypeHierarchyLocalStateContext = createContext<WorkItemTypeHierarchyLocalStateContextValue | null>(null);

type WorkItemTypeHierarchyLocalStateProviderProps = {
  children: ReactNode;
  storeFingerprint: string;
  storeGroupedByLevel: Map<number, BaseWorkItemTypeInstanceSchema[]>;
  workspaceSlug: string;
};

export function WorkItemTypeHierarchyLocalStateProvider({
  children,
  storeFingerprint,
  storeGroupedByLevel,
  workspaceSlug,
}: WorkItemTypeHierarchyLocalStateProviderProps) {
  // states
  const [localMap, setLocalMap] = useState(() => cloneGroupedByLevel(storeGroupedByLevel));
  const [originalLevelByTypeId, setOriginalLevelByTypeId] = useState(() =>
    buildTypeIdToOriginalLevelMap(storeGroupedByLevel)
  );
  // store hooks
  const { getWorkItemType } = useWorkItemType();
  // translation
  const { t } = useTranslation();
  // changes made in the current session
  const pendingLevelChanges = useMemo((): WorkItemTypeHierarchyPendingLevelChange[] => {
    const rows: WorkItemTypeHierarchyPendingLevelChange[] = [];
    for (const [currentLevel, types] of localMap) {
      for (const workItemType of types) {
        const previousLevel = originalLevelByTypeId.get(workItemType.id);
        if (previousLevel !== undefined && previousLevel !== currentLevel) {
          rows.push({ workItemType, previousLevel, currentLevel });
        }
      }
    }
    return rows;
  }, [localMap, originalLevelByTypeId]);
  // whether there are any pending hierarchy changes
  const hasPendingHierarchyChanges = pendingLevelChanges.length > 0;
  // reset the local state from the store
  const resetFromStore = useCallback((storeMap: Map<number, BaseWorkItemTypeInstanceSchema[]>) => {
    setLocalMap(cloneGroupedByLevel(storeMap));
    setOriginalLevelByTypeId(buildTypeIdToOriginalLevelMap(storeMap));
  }, []);
  // reset the local state from the store when the store fingerprint changes
  useEffect(() => {
    if (!hasPendingHierarchyChanges) {
      setLocalMap(cloneGroupedByLevel(storeGroupedByLevel));
      setOriginalLevelByTypeId(buildTypeIdToOriginalLevelMap(storeGroupedByLevel));
    }
  }, [storeFingerprint, hasPendingHierarchyChanges, storeGroupedByLevel]);
  // callback for drop event
  const applyHierarchyDrop = useCallback(
    ({
      workItemTypeId,
      sourceLevel,
      targetLevel,
    }: {
      workItemTypeId: string;
      sourceLevel: number;
      targetLevel: number;
    }) => {
      if (sourceLevel === targetLevel) return;
      setLocalMap((prev) =>
        normalizeHierarchyMap(moveTypeBetweenLevels(prev, workItemTypeId, sourceLevel, targetLevel))
      );
    },
    []
  );
  // callback for discard button
  const discardHierarchyChanges = useCallback(() => {
    resetFromStore(storeGroupedByLevel);
  }, [resetFromStore, storeGroupedByLevel]);
  // callback to sync the hierarchy local state with the store
  const syncHierarchyLocalStateAfterPersist = useCallback(() => {
    setLocalMap((prev) => {
      const next = regroupByModelLevel(prev);
      setOriginalLevelByTypeId(buildTypeIdToOriginalLevelMap(next));
      return next;
    });
  }, []);
  // callback to save the hierarchy changes, either after save button or after break hierarchy button
  const saveHierarchyChanges: WorkItemTypeHierarchyLocalStateContextValue["saveHierarchyChanges"] = useCallback(
    async (args) => {
      const { onValidationChangeViolation } = args;
      const payload: TValidateLevelChangePayload = {};
      for (const change of pendingLevelChanges) {
        payload[change.workItemType.id] = change.currentLevel;
      }
      const loadingToastId = setToast({
        type: TOAST_TYPE.LOADING,
        title: t("work_item_type_hierarchy.levels.pending_changes.validating"),
      });
      try {
        await workspaceWorkItemTypesService.validateLevelChangeAndUpdateTypes(workspaceSlug, payload);
        Object.entries(payload).forEach(([typeId, level]) => {
          const workItemType = getWorkItemType(typeId);
          workItemType?.mutateProperties({ level });
        });
        syncHierarchyLocalStateAfterPersist();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("work_item_type_hierarchy.levels.pending_changes.success_toast.title"),
          message: t("work_item_type_hierarchy.levels.pending_changes.success_toast.message"),
        });
      } catch (error) {
        if (!axios.isAxiosError(error)) return;
        if (error.response?.status === 400 && error.response.data.error) {
          onValidationChangeViolation(payload, error.response.data.error);
        } else {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("work_item_type_hierarchy.levels.pending_changes.error_toast.title"),
            message: t("work_item_type_hierarchy.levels.pending_changes.error_toast.message"),
          });
        }
      } finally {
        dismissToast(loadingToastId);
      }
    },
    [getWorkItemType, pendingLevelChanges, syncHierarchyLocalStateAfterPersist, t, workspaceSlug]
  );
  // callback to check if a type has been modified in the current session
  const isTypeModified = useCallback(
    (workItemTypeId: string, currentLevel: number) => originalLevelByTypeId.get(workItemTypeId) !== currentLevel,
    [originalLevelByTypeId]
  );

  const value = useMemo(
    () => ({
      localWorkItemTypesByLevel: localMap,
      pendingLevelChanges,
      hasPendingHierarchyChanges,
      isTypeModified,
      applyHierarchyDrop,
      discardHierarchyChanges,
      saveHierarchyChanges,
    }),
    [
      localMap,
      pendingLevelChanges,
      hasPendingHierarchyChanges,
      isTypeModified,
      applyHierarchyDrop,
      discardHierarchyChanges,
      saveHierarchyChanges,
    ]
  );

  return (
    <WorkItemTypeHierarchyLocalStateContext.Provider value={value}>
      {children}
    </WorkItemTypeHierarchyLocalStateContext.Provider>
  );
}

export function useWorkItemTypeHierarchyLocalState(): WorkItemTypeHierarchyLocalStateContextValue {
  const ctx = useContext(WorkItemTypeHierarchyLocalStateContext);
  if (!ctx) {
    throw new Error("useWorkItemTypeHierarchyLocalState must be used within WorkItemTypeHierarchyLocalStateProvider");
  }
  return ctx;
}
