"use client";

import React, { useState, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IIssueLabel } from "@plane/types";
import { Button, Loader } from "@plane/ui";
import { DetailedEmptyState } from "@/components/empty-state";
import {
  CreateUpdateLabelInline,
  DeleteLabelModal,
  ProjectSettingLabelGroup,
  ProjectSettingLabelItem,
} from "@/components/labels";
// hooks
import { useLabel, useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web imports

export const ProjectSettingsLabelList: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // refs
  const scrollToRef = useRef<HTMLFormElement>(null);
  // states
  const [showLabelForm, setLabelForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<IIssueLabel | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { projectLabels, updateLabelPosition, projectLabelsTree } = useLabel();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isEditable = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/project-settings/labels" });

  const newLabel = () => {
    setIsUpdating(false);
    setLabelForm(true);
  };

  const onDrop = (
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => {
    if (workspaceSlug && projectId) {
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
      <div className="flex items-center justify-between border-b border-custom-border-100 pb-3.5">
        <h3 className="text-xl font-medium">Labels</h3>
        {isEditable && (
          <Button variant="primary" onClick={newLabel} size="sm">
            {t("common.add_label")}
          </Button>
        )}
      </div>
      <div className="w-full py-2">
        {showLabelForm && (
          <div className="my-2 w-full rounded border border-custom-border-200 px-3.5 py-2">
            <CreateUpdateLabelInline
              labelForm={showLabelForm}
              setLabelForm={setLabelForm}
              isUpdating={isUpdating}
              ref={scrollToRef}
              onClose={() => {
                setLabelForm(false);
                setIsUpdating(false);
              }}
            />
          </div>
        )}
        {projectLabels ? (
          projectLabels.length === 0 && !showLabelForm ? (
            <div className="flex items-center justify-center h-full w-full">
              <DetailedEmptyState
                title={t("project_settings.empty_state.labels.title")}
                description={t("project_settings.empty_state.labels.description")}
                assetPath={resolvedPath}
              />
            </div>
          ) : (
            projectLabelsTree && (
              <div className="mt-3">
                {projectLabelsTree.map((label, index) => {
                  if (label.children && label.children.length) {
                    return (
                      <ProjectSettingLabelGroup
                        key={label.id}
                        label={label}
                        labelChildren={label.children || []}
                        handleLabelDelete={(label: IIssueLabel) => setSelectDeleteLabel(label)}
                        isUpdating={isUpdating}
                        setIsUpdating={setIsUpdating}
                        isLastChild={index === projectLabelsTree.length - 1}
                        onDrop={onDrop}
                        isEditable={isEditable}
                      />
                    );
                  }
                  return (
                    <ProjectSettingLabelItem
                      label={label}
                      key={label.id}
                      setIsUpdating={setIsUpdating}
                      handleLabelDelete={(label) => setSelectDeleteLabel(label)}
                      isChild={false}
                      isLastChild={index === projectLabelsTree.length - 1}
                      onDrop={onDrop}
                      isEditable={isEditable}
                    />
                  );
                })}
              </div>
            )
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
