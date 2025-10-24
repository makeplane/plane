"use client";

import React, { useState, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, PROJECT_SETTINGS_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { IIssueLabel } from "@plane/types";
import { Loader } from "@plane/ui";
import type { TLabelOperationsCallbacks } from "@/components/labels";
import {
  CreateUpdateLabelInline,
  DeleteLabelModal,
  ProjectSettingLabelGroup,
  ProjectSettingLabelItem,
} from "@/components/labels";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useLabel } from "@/hooks/store/use-label";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { SettingsHeading } from "../settings/heading";

export const ProjectSettingsLabelList: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // refs
  const scrollToRef = useRef<HTMLDivElement>(null);
  // states
  const [showLabelForm, setLabelForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<IIssueLabel | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { projectLabels, updateLabelPosition, projectLabelsTree, createLabel, updateLabel } = useLabel();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isEditable = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);
  const labelOperationsCallbacks: TLabelOperationsCallbacks = {
    createLabel: (data: Partial<IIssueLabel>) => createLabel(workspaceSlug?.toString(), projectId?.toString(), data),
    updateLabel: (labelId: string, data: Partial<IIssueLabel>) =>
      updateLabel(workspaceSlug?.toString(), projectId?.toString(), labelId, data),
  };

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
      <SettingsHeading
        title={t("project_settings.labels.heading")}
        description={t("project_settings.labels.description")}
        button={{
          label: t("common.add_label"),
          onClick: () => {
            newLabel();
            captureClick({
              elementName: PROJECT_SETTINGS_TRACKER_ELEMENTS.LABELS_HEADER_CREATE_BUTTON,
            });
          },
        }}
        showButton={isEditable}
      />

      <div className="w-full py-2">
        {showLabelForm && (
          <div className="my-2 w-full rounded border border-custom-border-200 px-3.5 py-2">
            <CreateUpdateLabelInline
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
        {projectLabels ? (
          projectLabels.length === 0 && !showLabelForm ? (
            <EmptyStateCompact
              assetKey="label"
              assetClassName="size-20"
              title={t("settings.labels.title")}
              description={t("settings.labels.description")}
              actions={[
                {
                  label: t("settings.labels.cta_primary"),
                  onClick: () => {
                    newLabel();
                    captureClick({
                      elementName: PROJECT_SETTINGS_TRACKER_ELEMENTS.LABELS_EMPTY_STATE_CREATE_BUTTON,
                    });
                  },
                },
              ]}
              align="start"
              rootClassName="py-20"
            />
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
                        labelOperationsCallbacks={labelOperationsCallbacks}
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
                      labelOperationsCallbacks={labelOperationsCallbacks}
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
