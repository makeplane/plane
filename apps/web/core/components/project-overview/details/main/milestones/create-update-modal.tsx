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

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { LayersIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { ISearchIssueResponse, TMilestone } from "@plane/types";
import { EFileAssetType } from "@plane/types";
import { Button } from "@plane/propel/button";
import { EModalPosition, Input, Loader, ModalCore } from "@plane/ui";
import { cn, getChangedFields, getDescriptionPlaceholderI18n, renderFormattedPayloadDate } from "@plane/utils";
import { DateDropdown } from "@/components/dropdowns/date";
import { RichTextEditor } from "@/components/editor/rich-text";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
import useKeypress from "@/hooks/use-keypress";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
import { WorkspaceService } from "@/services/workspace.service";
import { MilestoneWorkItemActionButton } from "./quick-action-button";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  isOpen: boolean;
  handleClose: () => void;
  milestoneId?: string;
};

const defaultValues = {
  title: "",
  description: {
    description_html: "",
  },
};

export function CreateUpdateMilestoneModal(props: Props) {
  const { workspaceSlug, projectId, isOpen, handleClose, milestoneId } = props;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWorkItemIds, setSelectedWorkItemIds] = useState<string[]>([]);

  const { t } = useTranslation();
  const { getWorkspaceBySlug } = useWorkspace();
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  const {
    createMilestone,
    updateMilestone,
    getMilestoneById,
    addWorkItemsToMilestone,
    updateWorkItems,
    fetchMilestoneWorkItems,
  } = useMilestones();
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;

  // states
  const [isWorkItemsLoading, setIsWorkItemsLoading] = useState(false);

  // derived values
  const data = milestoneId ? getMilestoneById(projectId, milestoneId) : undefined;

  // hook form
  const {
    handleSubmit,
    control,
    reset,
    formState: { dirtyFields, errors },
  } = useForm<Partial<TMilestone>>({
    defaultValues,
  });

  const resetForm = () => {
    reset(defaultValues);
    setSelectedWorkItemIds([]);
  };

  const onClose = () => {
    handleClose();
    resetForm();
  };

  const handleAddWorkItems = async (workItemIds: string[], id: string) => {
    const promise = milestoneId
      ? updateWorkItems(workspaceSlug, projectId, id, workItemIds)
      : addWorkItemsToMilestone(workspaceSlug, projectId, id, workItemIds);

    await promise.catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to add work items to milestone. Please try again.",
      });
    });
  };

  const onSubmit = async (formData: Partial<TMilestone>) => {
    let payload: Partial<TMilestone> = {};
    if (milestoneId) {
      payload = getChangedFields<Partial<TMilestone>>(
        formData,
        dirtyFields as Partial<Record<Extract<keyof TMilestone, string>, boolean | undefined>>
      );
    } else payload = formData;

    setIsSubmitting(true);
    const promise = milestoneId
      ? updateMilestone(workspaceSlug, projectId, milestoneId, payload)
      : createMilestone(workspaceSlug, projectId, payload);
    await promise
      .then((response) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: milestoneId ? "Milestone updated successfully." : "Milestone created successfully.",
        });

        if (response?.id) handleAddWorkItems(selectedWorkItemIds, response.id);

        onClose();
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: milestoneId
            ? "Failed to update milestone. Please try again."
            : "Failed to create milestone. Please try again.",
        });
      });
    setIsSubmitting(false);
  };

  const handleWorkItemsSubmit = async (searchData: ISearchIssueResponse[]) => {
    setSelectedWorkItemIds(searchData.map((item) => item.id));
  };

  // fetch work items when modal is open
  useEffect(() => {
    if (isOpen && milestoneId) {
      setIsWorkItemsLoading(true);
      fetchMilestoneWorkItems(workspaceSlug, projectId, milestoneId)
        .then((workItemIds) => {
          setSelectedWorkItemIds(workItemIds);
          return;
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Failed to fetch work items. Please try again.",
          });
        })
        .finally(() => {
          setIsWorkItemsLoading(false);
        });
    }
  }, [isOpen, milestoneId, fetchMilestoneWorkItems, workspaceSlug, projectId]);

  // ensure data populates the form when available; fallback to defaultValues
  useEffect(() => {
    if (isOpen) {
      reset({
        ...defaultValues,
        ...(data ?? {}),
      });
    }
  }, [isOpen, data, reset]);

  useKeypress("Escape", () => {
    if (isOpen) onClose();
  });

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP}>
      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <h4 className="text-h4-medium text-secondary">{data?.id ? "Update Milestone" : "Create Milestone"}</h4>
            {/* Title */}
            <div className="space-y-1">
              <Controller
                name="title"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Input
                    type="text"
                    className={cn("text-body-xs-regular w-full", errors.title ? "border-danger-strong" : "")}
                    value={value}
                    onChange={onChange}
                    placeholder="Title"
                  />
                )}
                rules={{
                  required: "Title is required",
                }}
              />
              {errors.title && <p className="text-caption-sm-medium text-danger-primary">{errors.title.message}</p>}
            </div>
            {/* Description */}
            <Controller
              name="description.description_html"
              control={control}
              render={({ field: { value, onChange } }) => (
                <RichTextEditor
                  editable
                  id={data?.id ?? "milestone-modal-editor"}
                  initialValue={value ?? ""}
                  workspaceSlug={workspaceSlug}
                  workspaceId={workspaceId}
                  projectId={projectId}
                  onChange={(_description: object, description_html: string) => {
                    onChange(description_html);
                  }}
                  displayConfig={{ fontSize: "small-font" }}
                  placeholder={(isFocused, description) => t(getDescriptionPlaceholderI18n(isFocused, description))}
                  searchMentionCallback={async (payload) =>
                    await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
                      ...payload,
                      project_id: projectId?.toString() ?? "",
                    })
                  }
                  containerClassName="pt-3 min-h-[150px] rounded-lg relative border border-subtle"
                  uploadFile={async (blockId, file) => {
                    try {
                      const { asset_id } = await uploadEditorAsset({
                        blockId,
                        data: {
                          entity_identifier: data?.id ?? "",
                          entity_type: EFileAssetType.MILESTONE_DESCRIPTION,
                        },
                        file,
                        projectId,
                        workspaceSlug,
                      });
                      return asset_id;
                    } catch (_error) {
                      throw new Error("Asset upload failed. Please try again later.");
                    }
                  }}
                  duplicateFile={async (assetId: string) => {
                    try {
                      const { asset_id } = await duplicateEditorAsset({
                        assetId,
                        entityId: data?.id,
                        entityType: EFileAssetType.MILESTONE_DESCRIPTION,
                        projectId,
                        workspaceSlug,
                      });
                      return asset_id;
                    } catch (_error) {
                      throw new Error("Asset duplication failed. Please try again later.");
                    }
                  }}
                />
              )}
            />
            <div className="flex items-center gap-2">
              <MilestoneWorkItemActionButton
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                customButton={
                  isWorkItemsLoading ? (
                    <Loader>
                      <Loader.Item height="28px" width="48px" />
                    </Loader>
                  ) : (
                    <Button variant="secondary" className="text-caption-sm-medium text-primary">
                      <LayersIcon className="size-3" />
                      {selectedWorkItemIds.length > 0 ? (
                        <span className="text-caption-sm-medium">{selectedWorkItemIds.length}</span>
                      ) : (
                        "Link work items"
                      )}
                    </Button>
                  )
                }
                handleSubmit={handleWorkItemsSubmit}
                selectedWorkItemIds={selectedWorkItemIds}
                milestoneId={milestoneId}
              />
              <div className="space-y-1 flex gap-2">
                <Controller
                  name="target_date"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <div className="h-7">
                      <DateDropdown
                        value={value || null}
                        onChange={(date) => onChange(date ? renderFormattedPayloadDate(date) : null)}
                        buttonVariant="border-with-text"
                        placeholder="Target date"
                      />
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
          <div className="flex border-t items-center border-subtle pt-3 mt-3 justify-end gap-3">
            <Button variant="secondary" size="lg" onClick={onClose}>
              Discard
            </Button>
            <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
              {data?.id ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </ModalCore>
  );
}
