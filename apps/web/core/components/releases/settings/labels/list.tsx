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

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ReleaseLabel, ReleaseLabelWrite } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { SettingsHeading } from "@/components/settings/heading";
// hooks
// services
import releaseService from "@/services/release.service";
// local
import { DeleteReleaseLabelModal } from "./delete-modal";
import type { ReleaseLabelOperationsCallbacks } from "./inline-form";
import { CreateUpdateReleaseLabelInline } from "./inline-form";
import { ReleaseLabelItem } from "./label-item";
import { useReleasePermissions } from "@/hooks/permissions/use-release-permissions";

type Props = {
  workspaceSlug: string;
};

export const ReleasesLabelList = observer(function ReleasesLabelList({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const scrollToRef = useRef<HTMLDivElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<ReleaseLabel | null>(null);

  const releaseLabelPermissions = useReleasePermissions(workspaceSlug).getLabelPermissions();

  const {
    data: labels,
    isLoading,
    mutate,
  } = useSWR(`RELEASE_LABELS_${workspaceSlug}`, () => releaseService.listLabels(workspaceSlug), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  const handleError = (error: unknown) => {
    const errorObj = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
    const nameErrors = Array.isArray(errorObj["name"]) ? (errorObj["name"] as string[]) : [];
    if (nameErrors[0] === "RELEASE_LABEL_NAME_ALREADY_EXISTS") {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("releases.settings.labels.errors.name_already_exists"),
      });
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("releases.settings.labels.errors.generic"),
      });
    }
  };

  const labelOperationsCallbacks: ReleaseLabelOperationsCallbacks = {
    createLabel: async (data: ReleaseLabelWrite) => {
      try {
        const created = await releaseService.createLabel(workspaceSlug, data);
        void mutate((prev) => (prev ? [...prev, created] : [created]), false);
        return created;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    updateLabel: async (labelId: string, data: Partial<ReleaseLabelWrite>) => {
      try {
        const updated = await releaseService.updateLabel(workspaceSlug, labelId, data);
        void mutate((prev) => prev?.map((l) => (l.id === labelId ? updated : l)), false);
        return updated;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
  };

  const onDrop = async (draggingLabelId: string, droppedLabelId: string | undefined, dropAtEndOfList: boolean) => {
    if (!labels) return;
    const sorted = [...labels].sort((a, b) => a.sort_order - b.sort_order);
    const dragging = sorted.find((l) => l.id === draggingLabelId);
    if (!dragging) return;

    let newSortOrder: number;
    if (dropAtEndOfList) {
      newSortOrder = sorted[sorted.length - 1].sort_order + 10000;
    } else if (!droppedLabelId || sorted[0]?.id === droppedLabelId) {
      newSortOrder = (sorted[0]?.sort_order ?? 10000) / 2;
    } else {
      const droppedIndex = sorted.findIndex((l) => l.id === droppedLabelId);
      const prev = sorted[droppedIndex - 1];
      const dropped = sorted[droppedIndex];
      newSortOrder = (prev.sort_order + dropped.sort_order) / 2;
    }

    // Optimistic update
    void mutate((prev) => prev?.map((l) => (l.id === draggingLabelId ? { ...l, sort_order: newSortOrder } : l)), false);
    try {
      await releaseService.updateLabel(workspaceSlug, draggingLabelId, { sort_order: newSortOrder });
    } catch (error) {
      void mutate();
      console.error("Error in updating label:", error);
      setToast({ type: TOAST_TYPE.ERROR, title: t("error.something_went_wrong") });
    }
  };

  const newLabel = () => {
    setIsUpdating(false);
    setShowForm(true);
  };

  const sortedLabels = labels ? [...labels].sort((a, b) => a.sort_order - b.sort_order) : undefined;

  return (
    <>
      <DeleteReleaseLabelModal
        isOpen={!!selectDeleteLabel}
        data={selectDeleteLabel}
        onClose={() => setSelectDeleteLabel(null)}
        workspaceSlug={workspaceSlug}
        onSuccess={() => void mutate((prev) => prev?.filter((l) => l.id !== selectDeleteLabel?.id), false)}
      />

      <SettingsHeading
        title={t("releases.settings.labels.title")}
        description={t("releases.settings.labels.description")}
        control={
          releaseLabelPermissions.canCreate && (
            <Button onClick={newLabel} variant="secondary">
              {t("releases.settings.labels.add")}
            </Button>
          )
        }
        className="border-b-0"
        variant="h6"
      />

      <div ref={scrollToRef} className="mt-4 w-full bg-layer-3 rounded-lg border border-subtle p-2">
        {showForm && (
          <div className="w-full rounded border border-subtle mb-2">
            <CreateUpdateReleaseLabelInline
              isUpdating={isUpdating}
              labelOperationsCallbacks={labelOperationsCallbacks}
              onClose={() => {
                setShowForm(false);
                setIsUpdating(false);
              }}
            />
          </div>
        )}

        {isLoading && !showForm ? (
          <Loader className="space-y-5">
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
          </Loader>
        ) : sortedLabels && sortedLabels.length === 0 && !showForm ? (
          <EmptyStateCompact
            assetKey="label"
            assetClassName="size-20"
            title={t("releases.settings.labels.empty_state")}
            description=""
            actions={
              releaseLabelPermissions.canCreate ? [{ label: t("releases.settings.labels.add"), onClick: newLabel }] : []
            }
            align="start"
            rootClassName="py-20"
          />
        ) : (
          sortedLabels &&
          sortedLabels.map((label, index) => (
            <ReleaseLabelItem
              key={label.id}
              label={label}
              isLastChild={index === sortedLabels.length - 1}
              setIsUpdating={setIsUpdating}
              handleLabelDelete={(l) => setSelectDeleteLabel(l)}
              onDrop={onDrop}
              labelOperationsCallbacks={labelOperationsCallbacks}
              permissions={{
                canReorder: releaseLabelPermissions.getCanReorder(label.id),
                canEdit: releaseLabelPermissions.getCanEdit(label.id),
                canDelete: releaseLabelPermissions.getCanDelete(label.id),
              }}
            />
          ))
        )}
      </div>
    </>
  );
});
