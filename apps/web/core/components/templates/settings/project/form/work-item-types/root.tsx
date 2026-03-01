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

import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";

import { PlusIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setPromiseToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
import type { EIssuePropertyType, IIssueProperty, IIssueType, TProjectTemplateForm } from "@plane/types";
import { cn } from "@plane/utils";
// plane web imports
import { IssueTypeListItem } from "@/components/work-item-types/issue-type-list-item";
import { TemplateCollapsibleWrapper } from "@/components/templates/settings/common";
// local imports
import { ProjectTemplateWorkItemTypeModal } from "./create-update-modal";
import { DeleteWorkItemTypeModal } from "./delete-modal";

type TProjectWorkItemTypesProps = {
  workspaceSlug: string;
  projectTemplateId: string | undefined;
  getWorkItemTypeById: (workItemTypeId: string) => IIssueType | undefined;
  getCustomPropertyById: (customPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
};

export const ProjectWorkItemTypes = observer(function ProjectWorkItemTypes(props: TProjectWorkItemTypesProps) {
  const { workspaceSlug, projectTemplateId, getWorkItemTypeById, getCustomPropertyById } = props;
  // states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editIssueTypeId, setEditIssueTypeId] = useState<string | null>(null);
  const [deleteIssueTypeId, setDeleteIssueTypeId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [openIssueTypeId, setOpenIssueTypeId] = useState<string | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // form context
  const { control, watch, setValue } = useFormContext<TProjectTemplateForm>();
  // derived values
  const workItemTypes = watch("project.workitem_types");
  const workItemTypeIds = Object.keys(workItemTypes);
  const defaultWorkItemTypeId = workItemTypeIds.find((workItemTypeId) => workItemTypes[workItemTypeId]?.is_default);

  // handlers
  const handleIssueTypeListToggle = (issueTypeId: string) => {
    setOpenIssueTypeId((prev) => (prev === issueTypeId ? null : issueTypeId));
  };

  const handleEditIssueTypeIdChange = (issueTypeId: string) => {
    setEditIssueTypeId(issueTypeId);
    setIsModalOpen(true);
  };

  const handleWorkItemTypeListUpdate = (workItemTypeData: IIssueType) => {
    if (workItemTypeData.id && typeof workItemTypeData.id === "string") {
      setValue(
        "project.workitem_types",
        { ...workItemTypes, [workItemTypeData.id]: workItemTypeData },
        {
          shouldDirty: true,
        }
      );
    }
  };

  const handleDeleteIssueTypeIdChange = (issueTypeId: string) => {
    setDeleteIssueTypeId(issueTypeId);
    setIsDeleteModalOpen(true);
  };

  const handleEnableDisableWorkItemType = async (issueTypeId: string) => {
    const issueType = getWorkItemTypeById(issueTypeId);
    if (!issueType) return;
    const issueTypeDetail = issueType.asJSON;
    const isIssueTypeEnabled = issueTypeDetail?.is_active;
    const updateIssueTypePromise = issueType?.updateType({
      is_active: !issueTypeDetail?.is_active,
    });
    if (!updateIssueTypePromise) return;
    setPromiseToast(updateIssueTypePromise, {
      loading: t("work_item_types.enable_disable.toast.loading", {
        action: isIssueTypeEnabled ? t("common.disabling") : t("common.enabling"),
        name: issueTypeDetail?.name,
      }),
      success: {
        title: t("work_item_types.enable_disable.toast.success.title"),
        message: () =>
          t("work_item_types.enable_disable.toast.success.message", {
            name: issueTypeDetail?.name,
            action: isIssueTypeEnabled ? t("common.disabled") : t("common.enabled"),
          }),
      },
      error: {
        title: t("work_item_types.enable_disable.toast.error.title"),
        message: () =>
          t("work_item_types.enable_disable.toast.error.message", {
            name: issueTypeDetail?.name,
            action: isIssueTypeEnabled ? t("common.disabled") : t("common.enabled"),
          }),
      },
    });
  };

  const handleDeleteWorkItemType = async (issueTypeId: string) => {
    const issueType = getWorkItemTypeById(issueTypeId);
    if (!issueType) return;
    const deleteIssueTypePromise = issueType?.deleteProperty(issueTypeId);
    if (!deleteIssueTypePromise) return;
    await deleteIssueTypePromise.finally(() => {
      setDeleteIssueTypeId(null);
      setIsDeleteModalOpen(false);
      const updatedWorkItemTypes = { ...workItemTypes };
      delete updatedWorkItemTypes[issueTypeId];
      setValue("project.workitem_types", updatedWorkItemTypes);
    });
  };

  return (
    <>
      <TemplateCollapsibleWrapper
        title={t("work_item_types.label")}
        actionElement={({ setIsOpen }) => (
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(true);
                setIsModalOpen(true);
              }}
            >
              <PlusIcon className="size-4" />
            </Button>
            <Controller
              control={control}
              name="project.is_issue_type_enabled"
              render={({ field: { value, onChange } }) => (
                <Switch value={Boolean(value)} onChange={() => onChange(!value)} />
              )}
            />
          </div>
        )}
      >
        {workItemTypeIds.length > 0 && (
          <div>
            {workItemTypeIds.map((workItemTypeId) => (
              <IssueTypeListItem
                key={workItemTypeId}
                issueTypeId={workItemTypeId}
                isOpen={
                  openIssueTypeId === workItemTypeId ||
                  (workItemTypeId === defaultWorkItemTypeId && workItemTypeIds.length === 1)
                }
                isCollapseDisabled={workItemTypeId === defaultWorkItemTypeId && workItemTypeIds.length === 1}
                propertiesLoader={"loaded"}
                containerClassName="border-none"
                onToggle={handleIssueTypeListToggle}
                onEditIssueTypeIdChange={handleEditIssueTypeIdChange}
                getWorkItemTypeById={getWorkItemTypeById}
                getClassName={() => cn("bg-surface-1 hover:bg-surface-1 border border-subtle rounded-lg")}
                onEnableDisableIssueType={handleEnableDisableWorkItemType}
                onDeleteIssueTypeIdChange={handleDeleteIssueTypeIdChange}
              />
            ))}
          </div>
        )}
      </TemplateCollapsibleWrapper>
      <ProjectTemplateWorkItemTypeModal
        workspaceSlug={workspaceSlug}
        projectTemplateId={projectTemplateId}
        workItemTypeId={editIssueTypeId}
        isModalOpen={isModalOpen}
        handleWorkItemTypeListUpdate={handleWorkItemTypeListUpdate}
        handleModalClose={() => {
          setEditIssueTypeId(null);
          setIsModalOpen(false);
        }}
        getWorkItemTypeById={getWorkItemTypeById}
        getCustomPropertyById={getCustomPropertyById}
      />
      <DeleteWorkItemTypeModal
        issueTypeId={deleteIssueTypeId}
        isModalOpen={isDeleteModalOpen}
        handleModalClose={() => setIsDeleteModalOpen(false)}
        handleEnableDisable={handleEnableDisableWorkItemType}
        getWorkItemTypeById={getWorkItemTypeById}
        handleDelete={handleDeleteWorkItemType}
      />
    </>
  );
});
