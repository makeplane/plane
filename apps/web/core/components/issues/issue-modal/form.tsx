"use client";

import React, { FC, useState, useRef, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
// editor
import { ETabIndices, DEFAULT_WORK_ITEM_FORM_VALUES } from "@plane/constants";
import { EditorRefApi } from "@plane/editor";
// i18n
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType, TIssue, TWorkspaceDraftIssue } from "@plane/types";
// hooks
import { Button, ToggleSwitch, TOAST_TYPE, setToast } from "@plane/ui";
import {
  convertWorkItemDataToSearchResponse,
  getUpdateFormDataForReset,
  cn,
  getTextContent,
  getChangedIssuefields,
  getTabIndex,
} from "@plane/utils";
// components
import {
  IssueDefaultProperties,
  IssueDescriptionEditor,
  IssueParentTag,
  IssueProjectSelect,
  IssueTitleInput,
} from "@/components/issues/issue-modal/components";
import { CreateLabelModal } from "@/components/labels";
// helpers
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useIssueDetail, useLabel, useProject, useProjectState, useWorkspaceDraftIssues } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useProjectIssueProperties } from "@/hooks/use-project-issue-properties";
// plane web imports
import { DeDupeButtonRoot, DuplicateModalRoot } from "@/plane-web/components/de-dupe";
import { IssueTypeSelect, WorkItemTemplateSelect } from "@/plane-web/components/issues/issue-modal";
import { WorkItemModalAdditionalProperties } from "@/plane-web/components/issues/issue-modal/modal-additional-properties";
import { useDebouncedDuplicateIssues } from "@/plane-web/hooks/use-debounced-duplicate-issues";

export interface IssueFormProps {
  data?: Partial<TIssue>;
  issueTitleRef: React.MutableRefObject<HTMLInputElement | null>;
  isCreateMoreToggleEnabled: boolean;
  onAssetUpload: (assetId: string) => void;
  onCreateMoreToggleChange: (value: boolean) => void;
  onChange?: (formData: Partial<TIssue> | null) => void;
  onClose: () => void;
  onSubmit: (values: Partial<TIssue>, is_draft_issue?: boolean) => Promise<void>;
  projectId: string;
  isDraft: boolean;
  moveToIssue?: boolean;
  modalTitle?: string;
  primaryButtonText?: {
    default: string;
    loading: string;
  };
  isDuplicateModalOpen: boolean;
  handleDuplicateIssueModal: (isOpen: boolean) => void;
  handleDraftAndClose?: () => void;
  isProjectSelectionDisabled?: boolean;
  storeType: EIssuesStoreType;
}

export const IssueFormRoot: FC<IssueFormProps> = observer((props) => {
  const { t } = useTranslation();
  const {
    data,
    issueTitleRef,
    onAssetUpload,
    onChange,
    onClose,
    onSubmit,
    projectId: defaultProjectId,
    isCreateMoreToggleEnabled,
    onCreateMoreToggleChange,
    isDraft,
    moveToIssue = false,
    modalTitle = `${data?.id ? t("update") : isDraft ? t("create_a_draft") : t("create_new_issue")}`,
    primaryButtonText = {
      default: `${data?.id ? t("update") : isDraft ? t("save_to_drafts") : t("save")}`,
      loading: `${data?.id ? t("updating") : t("saving")}`,
    },
    isDuplicateModalOpen,
    handleDuplicateIssueModal,
    handleDraftAndClose,
    isProjectSelectionDisabled = false,
    storeType,
  } = props;

  // states
  const [labelModal, setLabelModal] = useState(false);
  const [gptAssistantModal, setGptAssistantModal] = useState(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);

  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  // router
  const { workspaceSlug, projectId: routeProjectId } = useParams();

  // store hooks
  const { getProjectById } = useProject();
  const {
    workItemTemplateId,
    isApplyingTemplate,
    selectedParentIssue,
    setWorkItemTemplateId,
    setSelectedParentIssue,
    getIssueTypeIdOnProjectChange,
    getActiveAdditionalPropertiesLength,
    handlePropertyValuesValidation,
    handleCreateUpdatePropertyValues,
    handleTemplateChange,
  } = useIssueModal();
  const { isMobile } = usePlatformOS();
  const { moveIssue } = useWorkspaceDraftIssues();
  const { createLabel } = useLabel();

  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { fetchCycles } = useProjectIssueProperties();
  const { getStateById } = useProjectState();

  // form info
  const methods = useForm<TIssue>({
    defaultValues: { ...DEFAULT_WORK_ITEM_FORM_VALUES, project_id: defaultProjectId, ...data },
    reValidateMode: "onChange",
  });
  const {
    formState,
    formState: { isDirty, isSubmitting, dirtyFields },
    handleSubmit,
    reset,
    watch,
    control,
    getValues,
    setValue,
  } = methods;

  const projectId = watch("project_id");
  const activeAdditionalPropertiesLength = getActiveAdditionalPropertiesLength({
    projectId: projectId,
    workspaceSlug: workspaceSlug?.toString(),
    watch: watch,
  });

  // derived values
  const projectDetails = projectId ? getProjectById(projectId) : undefined;
  const isDisabled = isSubmitting || isApplyingTemplate;

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  //reset few fields on projectId change
  useEffect(() => {
    if (isDirty) {
      if (workItemTemplateId) {
        // reset work item template id
        setWorkItemTemplateId(null);
        reset({ ...DEFAULT_WORK_ITEM_FORM_VALUES, project_id: projectId });
        editorRef.current?.clearEditor();
      } else {
        reset(getUpdateFormDataForReset(projectId, getValues()));
      }
    }
    if (projectId && routeProjectId !== projectId) fetchCycles(workspaceSlug?.toString(), projectId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Update the issue type id when the project id changes
  useEffect(() => {
    const issueTypeId = watch("type_id");

    // if issue type id is present or project not available, return
    if (issueTypeId || !projectId) return;

    // get issue type id on project change
    const issueTypeIdOnProjectChange = getIssueTypeIdOnProjectChange(projectId);
    if (issueTypeIdOnProjectChange) setValue("type_id", issueTypeIdOnProjectChange, { shouldValidate: true });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, projectId]);

  useEffect(() => {
    if (workItemTemplateId && editorRef.current) {
      handleTemplateChange({
        workspaceSlug: workspaceSlug?.toString(),
        reset,
        editorRef,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workItemTemplateId]);

  const handleFormSubmit = async (formData: Partial<TIssue>, is_draft_issue = false) => {
    // Check if the editor is ready to discard
    if (!editorRef.current?.isEditorReadyToDiscard()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("editor_is_not_ready_to_discard_changes"),
      });
      return;
    }

    // check for required properties validation
    if (
      !handlePropertyValuesValidation({
        projectId: projectId,
        workspaceSlug: workspaceSlug?.toString(),
        watch: watch,
      })
    )
      return;

    const submitData = !data?.id
      ? formData
      : {
          ...getChangedIssuefields(formData, dirtyFields as { [key: string]: boolean | undefined }),
          project_id: getValues<"project_id">("project_id"),
          id: data.id,
          description_html: formData.description_html ?? "<p></p>",
          type_id: getValues<"type_id">("type_id"),
        };

    // this condition helps to move the issues from draft to project issues
    if (formData.hasOwnProperty("is_draft")) submitData.is_draft = formData.is_draft;

    await onSubmit(submitData, is_draft_issue)
      .then(() => {
        setGptAssistantModal(false);
        if (isCreateMoreToggleEnabled && workItemTemplateId) {
          handleTemplateChange({
            workspaceSlug: workspaceSlug?.toString(),
            reset,
            editorRef,
          });
        } else {
          reset({
            ...DEFAULT_WORK_ITEM_FORM_VALUES,
            ...(isCreateMoreToggleEnabled ? { ...data } : {}),
            project_id: getValues<"project_id">("project_id"),
            type_id: getValues<"type_id">("type_id"),
            description_html: data?.description_html ?? "<p></p>",
          });
          editorRef?.current?.clearEditor();
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleMoveToProjects = async () => {
    if (!data?.id || !data?.project_id || !data) return;
    setIsMoving(true);
    try {
      await handleCreateUpdatePropertyValues({
        issueId: data.id,
        issueTypeId: data.type_id,
        projectId: data.project_id,
        workspaceSlug: workspaceSlug?.toString(),
        isDraft: true,
      });

      await moveIssue(workspaceSlug.toString(), data.id, {
        ...data,
        ...getValues(),
      } as TWorkspaceDraftIssue);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to move work item to project. Please try again.",
      });
    } finally {
      setIsMoving(false);
    }
  };

  const condition =
    (watch("name") && watch("name") !== "") || (watch("description_html") && watch("description_html") !== "<p></p>");

  const handleFormChange = () => {
    if (!onChange) return;

    if (isDirty && condition) onChange(watch());
    else onChange(null);
  };

  // debounced duplicate issues swr
  const { duplicateIssues } = useDebouncedDuplicateIssues(
    workspaceSlug?.toString(),
    projectDetails?.workspace.toString(),
    projectId ?? undefined,
    {
      name: watch("name"),
      description_html: getTextContent(watch("description_html")),
    }
  );

  // executing this useEffect when the parent_id coming from the component prop
  useEffect(() => {
    const parentId = watch("parent_id") || undefined;
    if (!parentId) return;
    if (parentId === selectedParentIssue?.id || selectedParentIssue) return;

    const issue = getIssueById(parentId);
    if (!issue) return;

    const projectDetails = getProjectById(issue.project_id);
    if (!projectDetails) return;

    const stateDetails = getStateById(issue.state_id);

    setSelectedParentIssue(
      convertWorkItemDataToSearchResponse(workspaceSlug?.toString(), issue, projectDetails, stateDetails)
    );
  }, [watch, getIssueById, getProjectById, selectedParentIssue, getStateById]);

  // executing this useEffect when isDirty changes
  useEffect(() => {
    if (!onChange) return;

    if (isDirty && condition) onChange(watch());
    else onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  useEffect(() => {
    const formElement = formRef?.current;
    const modalElement = modalContainerRef?.current;

    if (!formElement || !modalElement) return;

    const resizeObserver = new ResizeObserver(() => {
      modalElement.style.maxHeight = `${formElement?.offsetHeight}px`;
    });

    resizeObserver.observe(formElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [formRef, modalContainerRef]);

  // TODO: Remove this after the de-dupe feature is implemented

  const shouldRenderDuplicateModal = isDuplicateModalOpen && duplicateIssues?.length > 0;

  return (
    <FormProvider {...methods}>
      {projectId && (
        <CreateLabelModal
          createLabel={createLabel.bind(createLabel, workspaceSlug?.toString(), projectId)}
          isOpen={labelModal}
          handleClose={() => setLabelModal(false)}
          onSuccess={(response) => {
            setValue<"label_ids">("label_ids", [...watch("label_ids"), response.id]);
            handleFormChange();
          }}
        />
      )}
      <div className="flex gap-2 bg-transparent">
        <div className="rounded-lg w-full">
          <form
            ref={formRef}
            onSubmit={handleSubmit((data) => handleFormSubmit(data))}
            className="flex flex-col w-full"
          >
            <div className="p-5 rounded-t-lg bg-custom-background-100">
              <h3 className="text-xl font-medium text-custom-text-200 pb-2">{modalTitle}</h3>
              <div className="flex items-center justify-between pt-2 pb-4">
                <div className="flex items-center gap-x-1">
                  <IssueProjectSelect
                    control={control}
                    disabled={!!data?.id || !!data?.sourceIssueId || isProjectSelectionDisabled}
                    handleFormChange={handleFormChange}
                  />
                  {projectId && storeType !== EIssuesStoreType.EPIC && (
                    <IssueTypeSelect
                      control={control}
                      projectId={projectId}
                      editorRef={editorRef}
                      disabled={!!data?.sourceIssueId}
                      handleFormChange={handleFormChange}
                      renderChevron
                    />
                  )}
                  {projectId && !data?.id && !data?.sourceIssueId && (
                    <WorkItemTemplateSelect
                      projectId={projectId}
                      typeId={watch("type_id")}
                      handleModalClose={() => {
                        if (handleDraftAndClose) {
                          handleDraftAndClose();
                        } else {
                          onClose();
                        }
                      }}
                      handleFormChange={handleFormChange}
                      renderChevron
                    />
                  )}
                </div>
                {duplicateIssues.length > 0 && (
                  <DeDupeButtonRoot
                    workspaceSlug={workspaceSlug?.toString()}
                    isDuplicateModalOpen={isDuplicateModalOpen}
                    label={
                      duplicateIssues.length === 1
                        ? `${duplicateIssues.length} ${t("duplicate_issue_found")}`
                        : `${duplicateIssues.length} ${t("duplicate_issues_found")}`
                    }
                    handleOnClick={() => handleDuplicateIssueModal(!isDuplicateModalOpen)}
                  />
                )}
              </div>
              {watch("parent_id") && selectedParentIssue && (
                <div className="pb-4">
                  <IssueParentTag
                    control={control}
                    selectedParentIssue={selectedParentIssue}
                    handleFormChange={handleFormChange}
                    setSelectedParentIssue={setSelectedParentIssue}
                  />
                </div>
              )}
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
                "pb-4 space-y-3 bg-custom-background-100",
                activeAdditionalPropertiesLength > 4 &&
                  "max-h-[45vh] overflow-hidden overflow-y-auto vertical-scrollbar scrollbar-sm"
              )}
            >
              <div className="px-5">
                <IssueDescriptionEditor
                  control={control}
                  isDraft={isDraft}
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
                isDraft={isDraft}
                workItemId={data?.id ?? data?.sourceIssueId}
                projectId={projectId}
                workspaceSlug={workspaceSlug?.toString()}
              />
            </div>
            <div
              className={cn(
                "px-4 py-3 border-t-[0.5px] border-custom-border-200 rounded-b-lg bg-custom-background-100",
                activeAdditionalPropertiesLength > 0 && "shadow-custom-shadow-xs"
              )}
            >
              <div className="pb-3 border-b-[0.5px] border-custom-border-200">
                <IssueDefaultProperties
                  control={control}
                  id={data?.id}
                  projectId={projectId}
                  workspaceSlug={workspaceSlug?.toString()}
                  selectedParentIssue={selectedParentIssue}
                  startDate={watch("start_date")}
                  targetDate={watch("target_date")}
                  parentId={watch("parent_id")}
                  isDraft={isDraft}
                  handleFormChange={handleFormChange}
                  setLabelModal={setLabelModal}
                  setSelectedParentIssue={setSelectedParentIssue}
                />
              </div>
              <div className="flex items-center justify-end gap-4 py-3" tabIndex={getIndex("create_more")}>
                {!data?.id && (
                  <div
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                    onClick={() => onCreateMoreToggleChange(!isCreateMoreToggleEnabled)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onCreateMoreToggleChange(!isCreateMoreToggleEnabled);
                    }}
                    role="button"
                  >
                    <ToggleSwitch value={isCreateMoreToggleEnabled} onChange={() => {}} size="sm" />
                    <span className="text-xs">{t("create_more")}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div tabIndex={getIndex("discard_button")}>
                    <Button
                      variant="neutral-primary"
                      size="sm"
                      onClick={() => {
                        if (editorRef.current?.isEditorReadyToDiscard()) {
                          onClose();
                        } else {
                          setToast({
                            type: TOAST_TYPE.ERROR,
                            title: "Error!",
                            message: "Editor is still processing changes. Please wait before proceeding.",
                          });
                        }
                      }}
                    >
                      {t("discard")}
                    </Button>
                  </div>
                  <div tabIndex={isDraft ? getIndex("submit_button") : getIndex("draft_button")}>
                    <Button
                      variant={moveToIssue ? "neutral-primary" : "primary"}
                      type="submit"
                      size="sm"
                      ref={submitBtnRef}
                      loading={isSubmitting}
                      disabled={isDisabled}
                    >
                      {isSubmitting ? primaryButtonText.loading : primaryButtonText.default}
                    </Button>
                  </div>

                  {moveToIssue && (
                    <Button
                      variant="primary"
                      type="button"
                      size="sm"
                      loading={isMoving}
                      onClick={handleMoveToProjects}
                      disabled={isMoving}
                    >
                      {t("add_to_project")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
        {shouldRenderDuplicateModal && (
          <div
            ref={modalContainerRef}
            className="relative flex flex-col gap-2.5 px-3 py-4 rounded-lg shadow-xl bg-pi-50"
            style={{ maxHeight: formRef?.current?.offsetHeight ? `${formRef.current.offsetHeight}px` : "436px" }}
          >
            <DuplicateModalRoot
              workspaceSlug={workspaceSlug.toString()}
              issues={duplicateIssues}
              handleDuplicateIssueModal={handleDuplicateIssueModal}
            />
          </div>
        )}
      </div>
    </FormProvider>
  );
});
