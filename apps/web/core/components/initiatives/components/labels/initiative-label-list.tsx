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

import { useState, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TInitiativeLabel } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import type { TInitiativeLabelOperationsCallbacks } from "./create-update-initiative-label-inline";
import { CreateUpdateInitiativeLabelInline } from "./create-update-initiative-label-inline";
import { DeleteInitiativeLabelModal } from "./delete-initiative-label-modal";
import { InitiativeLabelItem } from "./initiative-label-item";

export const InitiativeLabelList = observer(function InitiativeLabelList() {
  const { workspaceSlug } = useParams();
  const scrollToRef = useRef<HTMLDivElement>(null);
  // plane hooks
  const { t } = useTranslation();
  // states
  const [showLabelForm, setLabelForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<TInitiativeLabel | null>(null);
  // store hooks
  const {
    initiative: { createInitiativeLabel, updateInitiativeLabel, updateInitiativeLabelPosition, getInitiativesLabels },
  } = useInitiatives();
  const { allowPermissions } = useUserPermissions();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const initiativeLabels = getInitiativesLabels(workspaceSlug?.toString());

  // derived values
  const isEditable = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const isInitiativesFeatureEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_INITIATIVES_ENABLED);

  const handleError = (error: unknown) => {
    const errorObj = error as { name?: string[] };
    switch (errorObj.name?.[0]) {
      case "INITIATIVE_LABEL_NAME_ALREADY_EXISTS":
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("initiatives.initiative_labels.toast.label_already_exists"),
        });
        break;
      default:
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("common.something_went_wrong"),
        });
        break;
    }
  };

  const labelOperationsCallbacks: TInitiativeLabelOperationsCallbacks = {
    createLabel: async (data: Partial<TInitiativeLabel>) => {
      try {
        return await createInitiativeLabel(workspaceSlug?.toString(), data);
      } catch (error: unknown) {
        handleError(error);
        throw error;
      }
    },
    updateLabel: async (labelId: string, data: Partial<TInitiativeLabel>) => {
      try {
        return await updateInitiativeLabel(workspaceSlug?.toString(), labelId, data);
      } catch (error: unknown) {
        handleError(error);
        throw error;
      }
    },
  };

  const newLabel = () => {
    setIsUpdating(false);
    setLabelForm(true);
  };

  const onDrop = (draggingLabelId: string, droppedLabelId: string | undefined, dropAtEndOfList: boolean) => {
    if (workspaceSlug) {
      updateInitiativeLabelPosition(workspaceSlug.toString(), draggingLabelId, droppedLabelId, dropAtEndOfList);
    }
  };

  return (
    <>
      <DeleteInitiativeLabelModal
        isOpen={!!selectDeleteLabel}
        data={selectDeleteLabel ?? null}
        onClose={() => setSelectDeleteLabel(null)}
      />
      <SettingsHeading
        title={t("initiatives.initiative_settings.labels.heading")}
        description={t("initiatives.initiative_settings.labels.description")}
        control={isEditable && <Button onClick={newLabel}>{t("common.add_label")}</Button>}
        className="border-b-0"
        variant="h6"
      />
      <div className="mt-4 w-full bg-layer-3 rounded-lg border border-subtle p-2">
        {showLabelForm && (
          <div className="w-full rounded border border-subtle">
            <CreateUpdateInitiativeLabelInline
              labelForm={showLabelForm}
              setLabelForm={setLabelForm}
              isUpdating={isUpdating}
              labelOperationsCallbacks={labelOperationsCallbacks}
              ref={scrollToRef}
              onClose={() => {
                setLabelForm(false);
                setIsUpdating(false);
              }}
            />
          </div>
        )}
        {!isInitiativesFeatureEnabled ? (
          !showLabelForm && (
            <EmptyStateCompact
              assetKey="label"
              assetClassName="size-20"
              title="Enable initiatives to manage labels"
              description="Toggle initiatives on to organize and track your initiative labels."
              align="start"
              rootClassName="py-20"
            />
          )
        ) : initiativeLabels ? (
          initiativeLabels.size === 0 && !showLabelForm ? (
            <EmptyStateCompact
              assetKey="label"
              assetClassName="size-20"
              title={t("settings_empty_state.labels.title")}
              description={t("settings_empty_state.labels.description")}
              actions={[
                {
                  label: t("settings_empty_state.labels.cta_primary"),
                  onClick: () => newLabel(),
                },
              ]}
              align="start"
              rootClassName="py-20"
            />
          ) : (
            initiativeLabels.size > 0 &&
            Array.from(initiativeLabels.values())
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((label, index, sortedLabels) => (
                <InitiativeLabelItem
                  label={label}
                  key={label.id}
                  setIsUpdating={setIsUpdating}
                  handleLabelDelete={(label) => setSelectDeleteLabel(label)}
                  isParentDragging={false}
                  isChild={false}
                  isLastChild={index === sortedLabels.length - 1}
                  onDrop={onDrop}
                  labelOperationsCallbacks={labelOperationsCallbacks}
                />
              ))
          )
        ) : (
          !showLabelForm && (
            <Loader className="space-y-5">
              <Loader.Item height="42px" />
              <Loader.Item height="42px" />
              <Loader.Item height="42px" />
              <Loader.Item height="42px" />
            </Loader>
          )
        )}
      </div>
    </>
  );
});
