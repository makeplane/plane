"use client";

import type { FC } from "react";
import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { ETabIndices, DEFAULT_WORK_ITEM_FORM_VALUES } from "@plane/constants";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
import {
  convertWorkItemDataToSearchResponse,
  getUpdateFormDataForReset,
  cn,
  getTextContent,
  getChangedIssuefields,
  getTabIndex,
} from "@plane/utils";
import {
  IssueDefaultProperties,
  IssueDescriptionEditor,
  IssueParentTag,
  IssueProjectSelect,
  IssueTitleInput,
} from "@/components/issues/issue-modal/components";
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkspaceDraftIssues } from "@/hooks/store/workspace-draft";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useProjectIssueProperties } from "@/hooks/use-project-issue-properties";
import { DeDupeButtonRoot } from "@/plane-web/components/de-dupe/de-dupe-button";
import { DuplicateModalRoot } from "@/plane-web/components/de-dupe/duplicate-modal";
import { WorkItemTemplateSelect } from "@/plane-web/components/issues/issue-modal";
import { useDebouncedDuplicateIssues } from "@/plane-web/hooks/use-debounced-duplicate-issues";
import { ChevronRight } from "lucide-react";
import { IssueTypeSelect } from "@/plane-web/components/issues/issue-modal";
import { useProjectIssueTypes } from "@/hooks/store/use-project-issue-types";
import { IssueService } from "@/services/issue/issue.service";

type TIssueWithDynamicProperties = TIssue & {
  dynamic_properties?: Record<string, any>;
};

export interface BugIssueFormProps {
  data?: Partial<TIssueWithDynamicProperties>;
  issueTitleRef: React.MutableRefObject<HTMLInputElement | null>;
  isCreateMoreToggleEnabled: boolean;
  onAssetUpload: (assetId: string) => void;
  onCreateMoreToggleChange: (value: boolean) => void;
  onChange?: (formData: Partial<TIssueWithDynamicProperties> | null) => void;
  onClose: () => void;
  onSubmit: (values: Partial<TIssueWithDynamicProperties>, is_draft_issue?: boolean) => Promise<void>;
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
  showActionButtons?: boolean;
  dataResetProperties?: any[];
  storeType: EIssuesStoreType;
  initialDescriptionHtml?: string;
}

export const BugIssueFormRoot: FC<BugIssueFormProps> = observer((props) => {
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
    showActionButtons = true,
    dataResetProperties = [],
    storeType,
    initialDescriptionHtml,
  } = props;

  const [gptAssistantModal, setGptAssistantModal] = useState(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);

  const editorRef = useRef<EditorRefApi>(null);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  const { workspaceSlug, projectId: routeProjectId } = useParams();

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
    allowedProjectIds,
  } = useIssueModal();
  const { isMobile } = usePlatformOS();
  const { moveIssue } = useWorkspaceDraftIssues();

  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { fetchCycles } = useProjectIssueProperties();
  const { getStateById } = useProjectState();

  const methods = useForm<TIssueWithDynamicProperties>({
    defaultValues: {
      ...DEFAULT_WORK_ITEM_FORM_VALUES,
      project_id: defaultProjectId,
      ...data,
      dynamic_properties: data?.dynamic_properties || {},
      description_html: data?.description_html ?? initialDescriptionHtml ?? "<p></p>",
    },
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
  const [creating, setCreating] = useState<boolean>(false);
  const [projectInitDone, setProjectInitDone] = useState<boolean>(false);
  const activeAdditionalPropertiesLength = getActiveAdditionalPropertiesLength({
    projectId: projectId,
    workspaceSlug: workspaceSlug?.toString(),
    watch: watch,
  });

  const projectDetails = projectId ? getProjectById(projectId) : undefined;
  const isDisabled = isSubmitting || isApplyingTemplate;
  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  useEffect(() => {
    if (!projectInitDone && Array.isArray(allowedProjectIds) && allowedProjectIds.length > 0) {
      // 自动选择第一个可用项目
      if (!projectId) {
        setValue("project_id", allowedProjectIds[0], { shouldValidate: true });
      }
      setProjectInitDone(true);
    }
    if (Array.isArray(allowedProjectIds) && allowedProjectIds.length === 0) {
      setProjectInitDone(true);
    }
  }, [allowedProjectIds, projectId, setValue, projectInitDone]);

  useEffect(() => {
    if (isDirty) {
      if (workItemTemplateId) {
        setWorkItemTemplateId(null);
        reset({
          ...DEFAULT_WORK_ITEM_FORM_VALUES,
          project_id: projectId,
          dynamic_properties: {},
        });
        editorRef.current?.clearEditor();
      } else {
        const resetData = getUpdateFormDataForReset(projectId, getValues());
        reset({
          ...resetData,
          dynamic_properties: {},
        });
      }
    }
    if (projectId && routeProjectId !== projectId) fetchCycles(workspaceSlug?.toString(), projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (data) {
      reset({
        ...DEFAULT_WORK_ITEM_FORM_VALUES,
        project_id: projectId,
        ...data,
        description_html: initialDescriptionHtml ?? data.description_html,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dataResetProperties]);

  const { issueTypes } = useProjectIssueTypes(workspaceSlug?.toString(), projectId ?? undefined);

  useEffect(() => {
    if (!issueTypes || issueTypes.length === 0) return;
    const bugType = issueTypes.find((t) => t.name === "Bug");
    if (bugType) setValue("type_id", bugType.id, { shouldValidate: true });
  }, [issueTypes]);

  const condition =
    (watch("name") && watch("name") !== "") || (watch("description_html") && watch("description_html") !== "<p></p>");

  const handleFormChange = () => {
    if (!onChange) return;
    if (isDirty && condition) onChange(watch());
    else onChange(null);
  };

  const { duplicateIssues } = useDebouncedDuplicateIssues(
    workspaceSlug?.toString(),
    projectDetails?.workspace.toString(),
    projectId ?? undefined,
    {
      name: watch("name"),
      description_html: getTextContent(watch("description_html")),
      issueId: data?.id,
    }
  );

  useEffect(() => {
    const parentId = watch("parent_id") || undefined;
    if (!parentId) return;
    if (parentId === selectedParentIssue?.id || selectedParentIssue) return;
    const issue = getIssueById(parentId);
    if (!issue) return;
    const pd = getProjectById(issue.project_id);
    if (!pd) return;
    const sd = getStateById(issue.state_id);
    setSelectedParentIssue(convertWorkItemDataToSearchResponse(workspaceSlug?.toString(), issue, pd, sd));
  }, [watch, getIssueById, getProjectById, selectedParentIssue, getStateById]);

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
    return () => resizeObserver.disconnect();
  }, [formRef, modalContainerRef]);

  const shouldRenderDuplicateModal = isDuplicateModalOpen && duplicateIssues?.length > 0;

  const handleFormSubmit = async (formData: Partial<TIssueWithDynamicProperties>, is_draft_issue = false) => {
    if (!editorRef.current?.isEditorReadyToDiscard()) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t("editor_is_not_ready_to_discard_changes") });
      return;
    }
    if (!handlePropertyValuesValidation({ projectId: projectId, workspaceSlug: workspaceSlug?.toString(), watch }))
      return;
    if (!workspaceSlug || !projectId) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: "缺少项目或空间信息，无法创建缺陷" });
      return;
    }
    const payload: Partial<TIssueWithDynamicProperties> = {
      ...formData,
      project_id: projectId,
      type_id: getValues<"type_id">("type_id"),
      description_html: formData.description_html ?? "<p></p>",
    };
    const issueService = new IssueService();
    setCreating(true);
    try {
      const created = await issueService.createIssue(String(workspaceSlug), String(projectId), payload as any);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("success"), message: "创建成功" });
      await onSubmit(created, is_draft_issue);
      setGptAssistantModal(false);
      reset({
        ...DEFAULT_WORK_ITEM_FORM_VALUES,
        project_id: getValues<"project_id">("project_id"),
        type_id: getValues<"type_id">("type_id"),
        description_html: "<p></p>",
        dynamic_properties: {},
      });
      editorRef?.current?.clearEditor();
    } catch (error: any) {
      const msg = error?.error || error?.detail || error?.message || "创建失败";
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: msg });
    } finally {
      setCreating(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="flex gap-2 bg-transparent">
        <div className="rounded-lg w-full min-h-[75vh]">
          <form
            ref={formRef}
            onSubmit={handleSubmit((d) => handleFormSubmit(d))}
            className="flex flex-col w-full h-full"
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
                  <ChevronRight className="h-3 w-3 text-custom-text-400 flex-shrink-0" />
                  {projectId && (
                    <IssueTypeSelect
                      control={control as any}
                      projectId={projectId}
                      editorRef={editorRef}
                      disabled={true}
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
                "pb-4 space-y-3 bg-custom-background-100 flex-1",
                activeAdditionalPropertiesLength > 4 &&
                  "max-h-[65vh] overflow-hidden overflow-y-auto vertical-scrollbar scrollbar-sm"
              )}
            >
              <div className="max-h-[55vh] overflow-y-auto vertical-scrollbar scrollbar-sm">
                <div className="px-5">
                  <IssueDescriptionEditor
                    control={control}
                    isDraft={isDraft}
                    issueName={watch("name")}
                    issueId={data?.id}
                    descriptionHtmlData={initialDescriptionHtml ?? data?.description_html}
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
              </div>
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
                  setSelectedParentIssue={setSelectedParentIssue}
                />
              </div>
              {showActionButtons && (
                <div
                  className="flex items-center justify-end gap-4 pb-3 pt-6 border-t-[0.5px] border-custom-border-200"
                  tabIndex={getIndex("create_more")}
                >
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
                        loading={creating || isSubmitting}
                        disabled={
                          isDisabled || creating || !projectId || !(allowedProjectIds && allowedProjectIds.length > 0)
                        }
                      >
                        {creating || isSubmitting ? primaryButtonText.loading : primaryButtonText.default}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
        {projectInitDone && (!allowedProjectIds || allowedProjectIds.length === 0) && (
          <div className="px-3 py-2 text-sm text-red-700 bg-red-50 rounded">
            当前无可创建项目，请联系管理员或检查项目权限。
          </div>
        )}
        {shouldRenderDuplicateModal && (
          <div
            ref={modalContainerRef}
            className="relative flex flex-col gap-2.5 px-3 py-4 rounded-lg shadow-xl bg-pi-50"
            style={{ maxHeight: formRef?.current?.offsetHeight ? `${formRef.current.offsetHeight}px` : "436px" }}
          >
            <DuplicateModalRoot
              workspaceSlug={workspaceSlug?.toString() ?? ""}
              issues={duplicateIssues}
              handleDuplicateIssueModal={handleDuplicateIssueModal}
            />
          </div>
        )}
      </div>
    </FormProvider>
  );
});
