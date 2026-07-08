/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, FormProvider, useForm } from "react-hook-form";
// plane imports
import { DEFAULT_WORK_ITEM_FORM_VALUES, ETabIndices, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
import { cn, getChangedIssuefields, getDate, getTabIndex, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import {
  IssueDescriptionEditor,
  IssueProjectSelect,
  IssueTitleInput,
} from "@/components/issues/issue-modal/components";
import { IssueLabelSelect } from "@/components/issues/select";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useIssueTypes } from "@/hooks/store/use-issue-types";
import { useUserPermissions } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { WorkItemModalAdditionalProperties } from "@/plane-web/components/issues/issue-modal/modal-additional-properties";

/**
 * Fields an epic form is allowed to submit. The backend forces the epic type
 * and rejects parents (400), so `type_id` / `parent_id` are NEVER part of the
 * payload. Epics also do not belong to cycles/modules and have no estimate.
 */
const EPIC_PAYLOAD_KEYS: (keyof TIssue)[] = [
  "name",
  "description_html",
  "state_id",
  "priority",
  "assignee_ids",
  "label_ids",
  "start_date",
  "target_date",
];

const EPIC_PAYLOAD_KEY_SET = new Set<string>(EPIC_PAYLOAD_KEYS);

const pickEpicFields = (values: Partial<TIssue>): Partial<TIssue> =>
  Object.fromEntries(Object.entries(values).filter(([key]) => EPIC_PAYLOAD_KEY_SET.has(key))) as Partial<TIssue>;

// the epic form has no draft wrapper — nothing to do on intermediate changes
const handleFormChange = () => {};

export interface EpicFormRootProps {
  data?: Partial<TIssue>;
  issueTitleRef: React.MutableRefObject<HTMLInputElement | null>;
  isCreateMoreToggleEnabled: boolean;
  onAssetUpload: (assetId: string) => void;
  onCreateMoreToggleChange: (value: boolean) => void;
  onClose: () => void;
  onSubmit: (values: Partial<TIssue>) => Promise<void>;
  projectId: string;
  primaryButtonText?: {
    default: string;
    loading: string;
  };
}

export const EpicFormRoot = observer(function EpicFormRoot(props: EpicFormRootProps) {
  const {
    data,
    issueTitleRef,
    isCreateMoreToggleEnabled,
    onAssetUpload,
    onCreateMoreToggleChange,
    onClose,
    onSubmit,
    projectId: defaultProjectId,
    primaryButtonText,
  } = props;
  // i18n
  const { t } = useTranslation();
  // states
  const [gptAssistantModal, setGptAssistantModal] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectEpicId } = useIssueTypes();
  const { allowPermissions } = useUserPermissions();
  const { isMobile } = usePlatformOS();
  const { getActiveAdditionalPropertiesLength, handlePropertyValuesValidation } = useIssueModal();

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  // form info — the epic type id is kept in the form state only to drive the
  // additional (custom) properties of the epic type; it is never submitted.
  const epicTypeId = getProjectEpicId(defaultProjectId);
  const methods = useForm<TIssue>({
    defaultValues: {
      ...DEFAULT_WORK_ITEM_FORM_VALUES,
      project_id: defaultProjectId,
      ...data,
      type_id: data?.type_id ?? epicTypeId ?? null,
    },
    reValidateMode: "onChange",
  });
  const {
    formState,
    formState: { isSubmitting, dirtyFields },
    handleSubmit,
    reset,
    watch,
    control,
    getValues,
    setValue,
  } = methods;

  const projectId = watch("project_id");
  const startDate = watch("start_date");
  const targetDate = watch("target_date");

  // derived values
  const activeAdditionalPropertiesLength = getActiveAdditionalPropertiesLength({
    projectId: projectId,
    workspaceSlug: workspaceSlug?.toString(),
    watch: watch,
  });
  const canCreateLabel =
    projectId &&
    allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug?.toString(), projectId);
  const minDate = getDate(startDate);
  const maxDate = getDate(targetDate);
  const buttonText = primaryButtonText ?? {
    default: data?.id ? t("update") : t("save"),
    loading: data?.id ? t("updating") : t("saving"),
  };

  // keep the (hidden) type id in sync once the epic type is resolved so that
  // the custom properties of the epic type are displayed and validated
  useEffect(() => {
    if (epicTypeId && watch("type_id") !== epicTypeId) setValue("type_id", epicTypeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epicTypeId]);

  const handleFormSubmit = async (formData: TIssue) => {
    // Check if the editor is ready to discard
    if (!editorRef.current?.isEditorReadyToDiscard()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("editor_is_not_ready_to_discard_changes"),
      });
      return;
    }

    // check for required custom properties validation
    if (
      !handlePropertyValuesValidation({
        projectId: projectId,
        workspaceSlug: workspaceSlug?.toString(),
        watch: watch,
      })
    )
      return;

    const submitData: Partial<TIssue> = !data?.id
      ? {
          ...pickEpicFields(formData),
          description_html: formData.description_html ?? "<p></p>",
          project_id: getValues<"project_id">("project_id"),
        }
      : {
          ...pickEpicFields(getChangedIssuefields(formData, dirtyFields as { [key: string]: boolean | undefined })),
          project_id: getValues<"project_id">("project_id"),
          id: data.id,
          description_html: formData.description_html ?? "<p></p>",
        };
    // the backend picks the default state when none is inherited from the group
    if (!submitData.state_id) delete submitData.state_id;

    try {
      await onSubmit(submitData);
      setGptAssistantModal(false);
      reset({
        ...DEFAULT_WORK_ITEM_FORM_VALUES,
        ...(isCreateMoreToggleEnabled ? { ...data } : {}),
        project_id: getValues<"project_id">("project_id"),
        type_id: getValues<"type_id">("type_id"),
        description_html: data?.description_html ?? "<p></p>",
      });
      editorRef?.current?.clearEditor();
    } catch {
      // errors are surfaced with a toast by the modal
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="w-full rounded-lg bg-transparent">
        <form onSubmit={handleSubmit((formData) => handleFormSubmit(formData))} className="flex w-full flex-col">
          <div className="rounded-t-lg bg-surface-1 p-5">
            <h3 className="pb-2 text-h4-medium text-secondary">
              {data?.id ? t("epic.update.label") : t("epic.create.label")}
            </h3>
            <div className="flex items-center gap-x-1 pt-2 pb-4">
              {/* the project of an epic is fixed by the page context — the type is forced server-side */}
              <IssueProjectSelect control={control} disabled handleFormChange={handleFormChange} />
            </div>
            <div className="space-y-1">
              <IssueTitleInput
                control={control}
                issueTitleRef={issueTitleRef}
                formState={formState}
                handleFormChange={handleFormChange}
              />
            </div>
          </div>
          <div
            className={cn(
              "space-y-3 bg-surface-1 pb-4",
              activeAdditionalPropertiesLength > 4 &&
                "vertical-scrollbar scrollbar-sm max-h-[45vh] overflow-hidden overflow-y-auto"
            )}
          >
            <div className="px-5">
              <IssueDescriptionEditor
                control={control}
                isDraft={false}
                issueName={watch("name")}
                issueId={data?.id}
                descriptionHtmlData={data?.description_html}
                editorRef={editorRef}
                submitBtnRef={submitBtnRef}
                gptAssistantModal={gptAssistantModal}
                workspaceSlug={workspaceSlug?.toString()}
                projectId={projectId}
                handleFormChange={handleFormChange}
                handleDescriptionHTMLDataChange={(description_html) =>
                  setValue<"description_html">("description_html", description_html)
                }
                setGptAssistantModal={setGptAssistantModal}
                handleGptAssistantClose={() => reset(getValues())}
                onAssetUpload={onAssetUpload}
                onClose={onClose}
              />
            </div>
            <WorkItemModalAdditionalProperties
              isDraft={false}
              workItemId={data?.id ?? data?.sourceIssueId}
              projectId={projectId}
              workspaceSlug={workspaceSlug?.toString()}
            />
          </div>
          <div className="rounded-b-lg border-t-[0.5px] border-subtle bg-surface-1 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 pb-3">
              <Controller
                control={control}
                name="state_id"
                render={({ field: { value, onChange } }) => (
                  <div className="h-7">
                    <StateDropdown
                      value={value}
                      onChange={(stateId) => {
                        onChange(stateId);
                        handleFormChange();
                      }}
                      projectId={projectId ?? undefined}
                      buttonVariant="border-with-text"
                      tabIndex={getIndex("state_id")}
                      isForWorkItemCreation={!data?.id}
                    />
                  </div>
                )}
              />
              <Controller
                control={control}
                name="priority"
                render={({ field: { value, onChange } }) => (
                  <div className="h-7">
                    <PriorityDropdown
                      value={value}
                      onChange={(priority) => {
                        onChange(priority);
                        handleFormChange();
                      }}
                      buttonVariant="border-with-text"
                      tabIndex={getIndex("priority")}
                    />
                  </div>
                )}
              />
              <Controller
                control={control}
                name="assignee_ids"
                render={({ field: { value, onChange } }) => (
                  <div className="h-7">
                    <MemberDropdown
                      projectId={projectId ?? undefined}
                      value={value}
                      onChange={(assigneeIds) => {
                        onChange(assigneeIds);
                        handleFormChange();
                      }}
                      buttonVariant={value?.length > 0 ? "transparent-without-text" : "border-with-text"}
                      buttonClassName={value?.length > 0 ? "hover:bg-transparent" : ""}
                      placeholder={t("assignees")}
                      multiple
                      tabIndex={getIndex("assignee_ids")}
                    />
                  </div>
                )}
              />
              <Controller
                control={control}
                name="label_ids"
                render={({ field: { value, onChange } }) => (
                  <div className="h-7">
                    <IssueLabelSelect
                      value={value}
                      onChange={(labelIds) => {
                        onChange(labelIds);
                        handleFormChange();
                      }}
                      projectId={projectId ?? undefined}
                      tabIndex={getIndex("label_ids")}
                      createLabelEnabled={!!canCreateLabel}
                    />
                  </div>
                )}
              />
              <Controller
                control={control}
                name="start_date"
                render={({ field: { value, onChange } }) => (
                  <div className="h-7">
                    <DateDropdown
                      value={value}
                      onChange={(date) => {
                        onChange(date ? renderFormattedPayloadDate(date) : null);
                        handleFormChange();
                      }}
                      buttonVariant="border-with-text"
                      maxDate={maxDate ?? undefined}
                      placeholder={t("start_date")}
                      tabIndex={getIndex("start_date")}
                    />
                  </div>
                )}
              />
              <Controller
                control={control}
                name="target_date"
                render={({ field: { value, onChange } }) => (
                  <div className="h-7">
                    <DateDropdown
                      value={value}
                      onChange={(date) => {
                        onChange(date ? renderFormattedPayloadDate(date) : null);
                        handleFormChange();
                      }}
                      buttonVariant="border-with-text"
                      minDate={minDate ?? undefined}
                      placeholder={t("due_date")}
                      tabIndex={getIndex("target_date")}
                    />
                  </div>
                )}
              />
            </div>
            <div
              className="flex items-center justify-end gap-4 border-t-[0.5px] border-subtle pt-6 pb-3"
              tabIndex={getIndex("create_more")}
            >
              {!data?.id && (
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1.5"
                  onClick={() => onCreateMoreToggleChange(!isCreateMoreToggleEnabled)}
                >
                  <ToggleSwitch value={isCreateMoreToggleEnabled} onChange={() => {}} size="sm" />
                  <span className="text-caption-sm-regular">{t("create_more")}</span>
                </button>
              )}
              <div className="flex items-center gap-2">
                <div tabIndex={getIndex("discard_button")}>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      if (editorRef.current?.isEditorReadyToDiscard()) {
                        onClose();
                      } else {
                        setToast({
                          type: TOAST_TYPE.ERROR,
                          title: t("error"),
                          message: t("editor_is_not_ready_to_discard_changes"),
                        });
                      }
                    }}
                  >
                    {t("discard")}
                  </Button>
                </div>
                <div tabIndex={getIndex("submit_button")}>
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    ref={submitBtnRef}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? buttonText.loading : buttonText.default}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
});
