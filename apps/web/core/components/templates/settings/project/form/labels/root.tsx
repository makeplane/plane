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

import { useCallback, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useFormContext } from "react-hook-form";

import { EditIcon, PlusIcon, TrashIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IIssueLabel, TProjectTemplateForm } from "@plane/types";
import { cn, mockCreateOrUpdateLabel } from "@plane/utils";
// components
import type { TLabelOperationsCallbacks } from "@/components/labels/create-update-label-inline";
import { CreateUpdateLabelInline } from "@/components/labels/create-update-label-inline";
import type { ICustomMenuItem } from "@/components/labels/label-block/label-item-block";
import { LabelItemBlock } from "@/components/labels/label-block/label-item-block";
// plane web imports
import { TemplateCollapsibleWrapper } from "@/components/templates/settings/common";

type TProjectLabelsProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectLabels = observer(function ProjectLabels(props: TProjectLabelsProps) {
  const { workspaceSlug, projectId } = props;
  // refs
  const dragHandleRef = useRef<HTMLButtonElement>(null);
  const scrollToRef = useRef<HTMLDivElement>(null);
  // states
  const [showCreateLabelForm, setShowCreateLabelForm] = useState(false);
  const [showUpdateLabelForm, setShowUpdateLabelForm] = useState(false);
  const [labelToUpdate, setLabelToUpdate] = useState<IIssueLabel | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // form context
  const { watch, setValue } = useFormContext<TProjectTemplateForm>();
  // derived values
  const projectLabels = watch("project.labels");
  const showEmptyState = projectLabels.length === 0 && !showCreateLabelForm;

  const labelOperationsCallbacks: TLabelOperationsCallbacks = useMemo(
    () => ({
      createLabel: async (data: Partial<IIssueLabel>) =>
        mockCreateOrUpdateLabel(workspaceSlug, projectId, data).then((label) => {
          setValue("project.labels", [label, ...projectLabels], {
            shouldDirty: true,
          });
          return label;
        }),
      updateLabel: async (labelId: string, data: Partial<IIssueLabel>) =>
        mockCreateOrUpdateLabel(workspaceSlug, projectId, { ...data, id: labelId }).then((label) => {
          setValue(
            "project.labels",
            projectLabels.map((l) => (l.id === labelId ? label : l)),
            {
              shouldDirty: true,
            }
          );
          return label;
        }),
    }),
    [workspaceSlug, projectId, projectLabels, setValue]
  );

  const handleLabelDelete = useCallback(
    (label: IIssueLabel) => {
      setValue(
        "project.labels",
        projectLabels.filter((l) => l.id !== label.id),
        {
          shouldDirty: true,
        }
      );
    },
    [projectLabels, setValue]
  );

  const customMenuItems: ICustomMenuItem[] = useMemo(
    () => [
      {
        CustomIcon: EditIcon,
        onClick: (label: IIssueLabel) => {
          setLabelToUpdate(label);
          setShowUpdateLabelForm(true);
          setIsUpdating(true);
        },
        isVisible: true,
        text: "Edit label",
        key: "edit_label",
      },
      {
        CustomIcon: TrashIcon,
        onClick: handleLabelDelete,
        isVisible: true,
        text: "Delete label",
        key: "delete_label",
      },
    ],
    [handleLabelDelete]
  );

  return (
    <>
      <TemplateCollapsibleWrapper
        title={t("common.labels")}
        actionElement={({ setIsOpen }) => (
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(true);
                setShowCreateLabelForm(true);
              }}
            >
              <PlusIcon className="size-4" />
            </Button>
          </div>
        )}
      >
        <div className="flex flex-col gap-y-4 pt-2 pb-4">
          {showEmptyState && (
            <div className="px-5 text-body-xs-regular text-tertiary">
              {t("templates.empty_state.no_labels.description")}
            </div>
          )}
          {showCreateLabelForm && (
            <div className="w-full rounded-lg border border-subtle bg-surface-1 px-3.5 py-2.5">
              <CreateUpdateLabelInline
                labelForm={showCreateLabelForm}
                setLabelForm={setShowCreateLabelForm}
                isUpdating={isUpdating}
                labelOperationsCallbacks={labelOperationsCallbacks}
                ref={scrollToRef}
                onClose={() => {
                  setShowCreateLabelForm(false);
                  setIsUpdating(false);
                }}
              />
            </div>
          )}
          {projectLabels.map((label) => (
            <div
              key={label.id}
              className={cn(
                "py-3 group relative flex items-center justify-between gap-2 space-y-4 bg-surface-1 border border-subtle rounded-lg",
                showUpdateLabelForm && labelToUpdate?.id === label.id ? "px-4" : "pl-6"
              )}
            >
              {showUpdateLabelForm && labelToUpdate?.id === label.id ? (
                <CreateUpdateLabelInline
                  labelForm={showUpdateLabelForm}
                  setLabelForm={setShowUpdateLabelForm}
                  isUpdating={isUpdating}
                  labelOperationsCallbacks={labelOperationsCallbacks}
                  labelToUpdate={labelToUpdate}
                  ref={scrollToRef}
                  onClose={() => {
                    setShowUpdateLabelForm(false);
                    setIsUpdating(false);
                  }}
                />
              ) : (
                <LabelItemBlock
                  label={label}
                  isDragging={false}
                  customMenuItems={customMenuItems}
                  handleLabelDelete={handleLabelDelete}
                  dragHandleRef={dragHandleRef}
                  disabled={false}
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
      </TemplateCollapsibleWrapper>
    </>
  );
});
