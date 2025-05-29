"use client";

import React, { useState, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { labelFormState } from "./stores";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IIssueLabel } from "@plane/types";
import { Button, Loader } from "@plane/ui";
import { DetailedEmptyState } from "@/components/empty-state";
import {
  CreateUpdateLabelInline,
  DeleteLabelModal,
  TLabelOperationsCallbacks,
  SettingLabelGroup,
  SettingLabelItem,
} from "@/components/labels";
// hooks
import { useLabel, useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web imports

export const SettingsLabelList: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // refs
  const scrollToRef = useRef<HTMLDivElement>(null);
  // states
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<IIssueLabel | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { projectLabels, workspaceLabels, updateLabelPosition, workspaceLabelsTree, projectLabelsTree, createLabel, updateLabel } = useLabel();
  const labels = !projectId ? workspaceLabels : projectLabels;
  const labelsTree = !projectId ? workspaceLabelsTree : projectLabelsTree;
  const { allowPermissions } = useUserPermissions();
  // derived values
  const projectScope = typeof projectId != "undefined";
  const isEditable = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], projectScope ? EUserPermissionsLevel.PROJECT : EUserPermissionsLevel.WORKSPACE);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/project-settings/labels" });
  const labelOperationsCallbacks: TLabelOperationsCallbacks = {
    createLabel: (data: Partial<IIssueLabel>) => createLabel(workspaceSlug?.toString(), projectId?.toString(), data),
    updateLabel: (labelId: string, data: Partial<IIssueLabel>) => updateLabel(workspaceSlug?.toString(), projectId?.toString(), labelId, data),
  };

  const newLabel = () => {
    labelFormState.setIsUpdating(false);
    labelFormState.setLabelForm(true);
  };

  const onDrop = (
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => {
    if (workspaceSlug) {
      updateLabelPosition(
        workspaceSlug?.toString(),
        projectId?.toString(),
        draggingLabelId,
        droppedParentId,
        droppedLabelId,
        dropAtEndOfList
      );
      return;
    }
  };

  return (
    <>
      <DeleteLabelModal
        isOpen={!!selectDeleteLabel}
        data={selectDeleteLabel ?? null}
        onClose={() => setSelectDeleteLabel(null)}
      />
      {projectScope && (
        <div className="flex items-center justify-between border-b border-custom-border-100 pb-3.5">
          <h3 className="text-xl font-medium">Labels</h3>
          {isEditable && (
            <Button variant="primary" onClick={newLabel} size="sm">
              {t("common.add_label")}
            </Button>
          )}
        </div>
      )}
      <div className="w-full">
        {labelFormState.showLabelForm && (
          <div className="my-2 w-full rounded border border-custom-border-200 px-3.5 py-2">
            <CreateUpdateLabelInline
              labelForm={labelFormState.showLabelForm}
              setLabelForm={labelFormState.setLabelForm}
              isUpdating={labelFormState.isUpdating}
              labelOperationsCallbacks={labelOperationsCallbacks}
              ref={scrollToRef}
              onClose={() => {
                labelFormState.setLabelForm(false);
                labelFormState.setIsUpdating(false);
              }}
            />
          </div>
        )}
        {labels ? (
          labels.length === 0 && !labelFormState.showLabelForm ? (
            <div className="flex items-center justify-center h-full w-full">
              <DetailedEmptyState
                title={t("project_settings.empty_state.labels.title")}
                description={t("project_settings.empty_state.labels.description")}
                assetPath={resolvedPath}
              />
            </div>
          ) : (
            labelsTree && (
              <div className="mt-3">
                {labelsTree.map((label, index) => {
                  if (label.children && label.children.length) {
                    return (
                      <SettingLabelGroup
                        key={label.id}
                        label={label}
                        labelChildren={label.children || []}
                        handleLabelDelete={(label: IIssueLabel) => setSelectDeleteLabel(label)}
                        isUpdating={labelFormState.isUpdating}
                        setIsUpdating={labelFormState.setIsUpdating}
                        isLastChild={index === labelsTree.length - 1}
                        onDrop={onDrop}
                        isEditable={isEditable}
                        labelOperationsCallbacks={labelOperationsCallbacks}
                      />
                    );
                  }
                  return (
                    <SettingLabelItem
                      label={label}
                      key={label.id}
                      setIsUpdating={labelFormState.setIsUpdating}
                      handleLabelDelete={(label) => setSelectDeleteLabel(label)}
                      isChild={false}
                      isLastChild={index === labelsTree.length - 1}
                      onDrop={onDrop}
                      isEditable={isEditable}
                      labelOperationsCallbacks={labelOperationsCallbacks}
                    />
                  );
                })}
              </div>
            )
          )
        ) : (
          !labelFormState.showLabelForm && (
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
