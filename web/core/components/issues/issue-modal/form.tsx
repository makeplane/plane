"use client";

import React, { FC, useState, useRef, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { LayoutPanelTop, Sparkle, X } from "lucide-react";
// editor
import { EditorRefApi } from "@plane/editor";
// types
import type { TIssue, ISearchIssueResponse } from "@plane/types";
// hooks
import { Button, CustomMenu, Input, Loader, ToggleSwitch, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { GptAssistantPopover } from "@/components/core";
import {
  CycleDropdown,
  DateDropdown,
  EstimateDropdown,
  ModuleDropdown,
  PriorityDropdown,
  ProjectDropdown,
  MemberDropdown,
  StateDropdown,
} from "@/components/dropdowns";
import { RichTextEditor } from "@/components/editor/rich-text-editor/rich-text-editor";
import { ParentIssuesListModal } from "@/components/issues";
import { IssueLabelSelect } from "@/components/issues/select";
import { CreateLabelModal } from "@/components/labels";
// helpers
import { renderFormattedPayloadDate, getDate } from "@/helpers/date-time.helper";
import { getChangedIssuefields, getDescriptionPlaceholder } from "@/helpers/issue.helper";
import { shouldRenderProject } from "@/helpers/project.helper";
// hooks
import { useProjectEstimates, useInstance, useIssueDetail, useProject, useWorkspace } from "@/hooks/store";
import useKeypress from "@/hooks/use-keypress";
import { useProjectIssueProperties } from "@/hooks/use-project-issue-properties";
// services
import { AIService } from "@/services/ai.service";

const defaultValues: Partial<TIssue> = {
  project_id: "",
  name: "",
  description_html: "",
  estimate_point: null,
  state_id: "",
  parent_id: null,
  priority: "none",
  assignee_ids: [],
  label_ids: [],
  cycle_id: null,
  module_ids: null,
  start_date: null,
  target_date: null,
};

export interface IssueFormProps {
  data?: Partial<TIssue>;
  issueTitleRef: React.MutableRefObject<HTMLInputElement | null>;
  isCreateMoreToggleEnabled: boolean;
  onCreateMoreToggleChange: (value: boolean) => void;
  onChange?: (formData: Partial<TIssue> | null) => void;
  onClose: () => void;
  onSubmit: (values: Partial<TIssue>, is_draft_issue?: boolean) => Promise<void>;
  projectId: string;
  isDraft: boolean;
}

// services
const aiService = new AIService();

const TAB_INDICES = [
  "name",
  "description_html",
  "feeling_lucky",
  "ai_assistant",
  "state_id",
  "priority",
  "assignee_ids",
  "label_ids",
  "start_date",
  "target_date",
  "cycle_id",
  "module_ids",
  "estimate_point",
  "parent_id",
  "create_more",
  "discard_button",
  "draft_button",
  "submit_button",
  "project_id",
  "remove_parent",
];

const getTabIndex = (key: string) => TAB_INDICES.findIndex((tabIndex) => tabIndex === key) + 1;

export const IssueFormRoot: FC<IssueFormProps> = observer((props) => {
  const {
    data,
    issueTitleRef,
    onChange,
    onClose,
    onSubmit,
    projectId: defaultProjectId,
    isCreateMoreToggleEnabled,
    onCreateMoreToggleChange,
    isDraft,
  } = props;
  // states
  const [labelModal, setLabelModal] = useState(false);
  const [parentIssueListModalOpen, setParentIssueListModalOpen] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);
  const [gptAssistantModal, setGptAssistantModal] = useState(false);
  const [iAmFeelingLucky, setIAmFeelingLucky] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);
  // router
  const { workspaceSlug, projectId: routeProjectId } = useParams();
  // store hooks
  const workspaceStore = useWorkspace();
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug?.toString())?.id as string;
  const { config } = useInstance();
  const { getProjectById } = useProject();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();

  const handleKeyDown = (event: KeyboardEvent) => {
    if (editorRef.current?.isEditorReadyToDiscard()) {
      onClose();
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Editor is still processing changes. Please wait before proceeding.",
      });
      event.preventDefault(); // Prevent default action if editor is not ready to discard
    }
  };

  useKeypress("Escape", handleKeyDown);

  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { fetchCycles } = useProjectIssueProperties();
  // form info
  const {
    formState: { errors, isDirty, isSubmitting, dirtyFields },
    handleSubmit,
    reset,
    watch,
    control,
    getValues,
    setValue,
  } = useForm<TIssue>({
    defaultValues: { ...defaultValues, project_id: defaultProjectId, ...data },
    reValidateMode: "onChange",
  });

  const projectId = watch("project_id");

  //reset few fields on projectId change
  useEffect(() => {
    if (isDirty) {
      const formData = getValues();

      reset({
        ...defaultValues,
        project_id: projectId,
        name: formData.name,
        description_html: formData.description_html,
        priority: formData.priority,
        start_date: formData.start_date,
        target_date: formData.target_date,
        parent_id: formData.parent_id,
      });
    }
    if (projectId && routeProjectId !== projectId) fetchCycles(workspaceSlug?.toString(), projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (data?.description_html) setValue("description_html", data?.description_html);
  }, [data?.description_html]);

  const issueName = watch("name");

  const handleFormSubmit = async (formData: Partial<TIssue>, is_draft_issue = false) => {
    // Check if the editor is ready to discard
    if (!editorRef.current?.isEditorReadyToDiscard()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Editor is not ready to discard changes.",
      });
      return;
    }

    const submitData = !data?.id
      ? formData
      : {
          ...getChangedIssuefields(formData, dirtyFields as { [key: string]: boolean | undefined }),
          project_id: getValues("project_id"),
          id: data.id,
          description_html: formData.description_html ?? "<p></p>",
        };

    // this condition helps to move the issues from draft to project issues
    if (formData.hasOwnProperty("is_draft")) submitData.is_draft = formData.is_draft;

    await onSubmit(submitData, is_draft_issue);

    setGptAssistantModal(false);

    reset({
      ...defaultValues,
      ...(isCreateMoreToggleEnabled ? { ...data } : {}),
      project_id: getValues("project_id"),
      description_html: data?.description_html ?? "<p></p>",
    });
    editorRef?.current?.clearEditor();
  };

  const handleAiAssistance = async (response: string) => {
    if (!workspaceSlug || !projectId) return;

    editorRef.current?.setEditorValueAtCursorPosition(response);
  };

  const handleAutoGenerateDescription = async () => {
    if (!workspaceSlug || !projectId) return;

    setIAmFeelingLucky(true);

    aiService
      .createGptTask(workspaceSlug.toString(), {
        prompt: issueName,
        task: "Generate a proper description for this issue.",
      })
      .then((res) => {
        if (res.response === "")
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message:
              "Issue title isn't informative enough to generate the description. Please try with a different title.",
          });
        else handleAiAssistance(res.response_html);
      })
      .catch((err) => {
        const error = err?.data?.error;

        if (err.status === 429)
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: error || "You have reached the maximum number of requests of 50 requests per month per user.",
          });
        else
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: error || "Some error occurred. Please try again.",
          });
      })
      .finally(() => setIAmFeelingLucky(false));
  };

  const handleFormChange = () => {
    if (!onChange) return;

    if (isDirty && (watch("name") || watch("description_html"))) onChange(watch());
    else onChange(null);
  };

  const startDate = watch("start_date");
  const targetDate = watch("target_date");

  const minDate = getDate(startDate);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(targetDate);
  maxDate?.setDate(maxDate.getDate());

  const projectDetails = getProjectById(projectId);

  // executing this useEffect when the parent_id coming from the component prop
  useEffect(() => {
    const parentId = watch("parent_id") || undefined;
    if (!parentId) return;
    if (parentId === selectedParentIssue?.id || selectedParentIssue) return;

    const issue = getIssueById(parentId);
    if (!issue) return;

    const projectDetails = getProjectById(issue.project_id);
    if (!projectDetails) return;

    setSelectedParentIssue({
      id: issue.id,
      name: issue.name,
      project_id: issue.project_id,
      project__identifier: projectDetails.identifier,
      project__name: projectDetails.name,
      sequence_id: issue.sequence_id,
    } as ISearchIssueResponse);
  }, [watch, getIssueById, getProjectById, selectedParentIssue]);

  return (
    <>
      {projectId && (
        <CreateLabelModal
          isOpen={labelModal}
          handleClose={() => setLabelModal(false)}
          projectId={projectId}
          onSuccess={(response) => {
            setValue("label_ids", [...watch("label_ids"), response.id]);
            handleFormChange();
          }}
        />
      )}
      <form onSubmit={handleSubmit((data) => handleFormSubmit(data))}>
        <div className="space-y-5 p-5">
          <div className="flex items-center gap-x-3">
            {/* Don't show project selection if editing an issue */}
            {!data?.id && (
              <Controller
                control={control}
                name="project_id"
                rules={{
                  required: true,
                }}
                render={({ field: { value, onChange } }) => (
                  <div className="h-7">
                    <ProjectDropdown
                      value={value}
                      onChange={(projectId) => {
                        onChange(projectId);
                        handleFormChange();
                      }}
                      buttonVariant="border-with-text"
                      renderCondition={(project) => shouldRenderProject(project)}
                      tabIndex={getTabIndex("project_id")}
                    />
                  </div>
                )}
              />
            )}
            <h3 className="text-xl font-medium text-custom-text-200">{data?.id ? "Update" : "Create"} Issue</h3>
          </div>
          {watch("parent_id") && selectedParentIssue && (
            <Controller
              control={control}
              name="parent_id"
              render={({ field: { onChange } }) => (
                <div className="flex w-min items-center gap-2 whitespace-nowrap rounded bg-custom-background-90 p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="block h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: selectedParentIssue.state__color,
                      }}
                    />
                    <span className="flex-shrink-0 text-custom-text-200">
                      {selectedParentIssue.project__identifier}-{selectedParentIssue.sequence_id}
                    </span>
                    <span className="truncate font-medium">{selectedParentIssue.name.substring(0, 50)}</span>
                    <button
                      type="button"
                      className="grid place-items-center"
                      onClick={() => {
                        onChange(null);
                        handleFormChange();
                        setSelectedParentIssue(null);
                      }}
                      tabIndex={getTabIndex("remove_parent")}
                    >
                      <X className="h-3 w-3 cursor-pointer" />
                    </button>
                  </div>
                </div>
              )}
            />
          )}
          <div className="space-y-3">
            <div className="space-y-1">
              <Controller
                control={control}
                name="name"
                rules={{
                  required: "Title is required",
                  maxLength: {
                    value: 255,
                    message: "Title should be less than 255 characters",
                  },
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={value}
                    onChange={(e) => {
                      onChange(e.target.value);
                      handleFormChange();
                    }}
                    ref={issueTitleRef || ref}
                    hasError={Boolean(errors.name)}
                    placeholder="Title"
                    className="w-full text-base"
                    tabIndex={getTabIndex("name")}
                    autoFocus
                  />
                )}
              />
              <span className="text-xs text-red-500">{errors?.name?.message}</span>
            </div>
            <div className="border-[0.5px] border-custom-border-200 rounded-lg relative">
              {data?.description_html === undefined || !projectId ? (
                <Loader className="min-h-[150px] max-h-64 space-y-2 overflow-hidden rounded-md border border-custom-border-200 p-3 py-2 pt-3">
                  <Loader.Item width="100%" height="26px" />
                  <div className="flex items-center gap-2">
                    <Loader.Item width="26px" height="26px" />
                    <Loader.Item width="400px" height="26px" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader.Item width="26px" height="26px" />
                    <Loader.Item width="400px" height="26px" />
                  </div>
                  <Loader.Item width="80%" height="26px" />
                  <div className="flex items-center gap-2">
                    <Loader.Item width="50%" height="26px" />
                  </div>
                  <div className="border-0.5 absolute bottom-2 right-3.5 z-10 flex items-center gap-2">
                    <Loader.Item width="100px" height="26px" />
                    <Loader.Item width="50px" height="26px" />
                  </div>
                </Loader>
              ) : (
                <>
                  <Controller
                    name="description_html"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <RichTextEditor
                        initialValue={value ?? ""}
                        value={data.description_html}
                        workspaceSlug={workspaceSlug?.toString() as string}
                        workspaceId={workspaceId}
                        projectId={projectId}
                        onChange={(_description: object, description_html: string) => {
                          onChange(description_html);
                          handleFormChange();
                        }}
                        onEnterKeyPress={() => submitBtnRef?.current?.click()}
                        ref={editorRef}
                        tabIndex={getTabIndex("description_html")}
                        placeholder={getDescriptionPlaceholder}
                        containerClassName="pt-3 min-h-[150px]"
                      />
                    )}
                  />
                  <div className="border-0.5 z-10 flex items-center justify-end gap-2 p-3">
                    {issueName && issueName.trim() !== "" && config?.has_openai_configured && (
                      <button
                        type="button"
                        className={`flex items-center gap-1 rounded bg-custom-background-90 hover:bg-custom-background-80 px-1.5 py-1 text-xs ${
                          iAmFeelingLucky ? "cursor-wait" : ""
                        }`}
                        onClick={handleAutoGenerateDescription}
                        disabled={iAmFeelingLucky}
                        tabIndex={getTabIndex("feeling_lucky")}
                      >
                        {iAmFeelingLucky ? (
                          "Generating response"
                        ) : (
                          <>
                            <Sparkle className="h-3.5 w-3.5" />I{"'"}m feeling lucky
                          </>
                        )}
                      </button>
                    )}
                    {config?.has_openai_configured && projectId && (
                      <GptAssistantPopover
                        isOpen={gptAssistantModal}
                        handleClose={() => {
                          setGptAssistantModal((prevData) => !prevData);
                          // this is done so that the title do not reset after gpt popover closed
                          reset(getValues());
                        }}
                        onResponse={(response) => {
                          handleAiAssistance(response);
                        }}
                        placement="top-end"
                        button={
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded px-1.5 py-1 text-xs bg-custom-background-90 hover:bg-custom-background-80"
                            onClick={() => setGptAssistantModal((prevData) => !prevData)}
                            tabIndex={getTabIndex("ai_assistant")}
                          >
                            <Sparkle className="h-4 w-4" />
                            AI
                          </button>
                        }
                      />
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                      tabIndex={getTabIndex("state_id")}
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
                      tabIndex={getTabIndex("priority")}
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
                      placeholder="Assignees"
                      multiple
                      tabIndex={getTabIndex("assignee_ids")}
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
                      setIsOpen={setLabelModal}
                      value={value}
                      onChange={(labelIds) => {
                        onChange(labelIds);
                        handleFormChange();
                      }}
                      projectId={projectId ?? undefined}
                      tabIndex={getTabIndex("label_ids")}
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
                      onChange={(date) => onChange(date ? renderFormattedPayloadDate(date) : null)}
                      buttonVariant="border-with-text"
                      maxDate={maxDate ?? undefined}
                      placeholder="Start date"
                      tabIndex={getTabIndex("start_date")}
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
                      onChange={(date) => onChange(date ? renderFormattedPayloadDate(date) : null)}
                      buttonVariant="border-with-text"
                      minDate={minDate ?? undefined}
                      placeholder="Due date"
                      tabIndex={getTabIndex("target_date")}
                    />
                  </div>
                )}
              />
              {projectDetails?.cycle_view && (
                <Controller
                  control={control}
                  name="cycle_id"
                  render={({ field: { value, onChange } }) => (
                    <div className="h-7">
                      <CycleDropdown
                        projectId={projectId ?? undefined}
                        onChange={(cycleId) => {
                          onChange(cycleId);
                          handleFormChange();
                        }}
                        placeholder="Cycle"
                        value={value}
                        buttonVariant="border-with-text"
                        tabIndex={getTabIndex("cycle_id")}
                      />
                    </div>
                  )}
                />
              )}
              {projectDetails?.module_view && workspaceSlug && (
                <Controller
                  control={control}
                  name="module_ids"
                  render={({ field: { value, onChange } }) => (
                    <div className="h-7">
                      <ModuleDropdown
                        projectId={projectId ?? undefined}
                        value={value ?? []}
                        onChange={(moduleIds) => {
                          onChange(moduleIds);
                          handleFormChange();
                        }}
                        placeholder="Modules"
                        buttonVariant="border-with-text"
                        tabIndex={getTabIndex("module_ids")}
                        multiple
                        showCount
                      />
                    </div>
                  )}
                />
              )}
              {projectId && areEstimateEnabledByProjectId(projectId) && (
                <Controller
                  control={control}
                  name="estimate_point"
                  render={({ field: { value, onChange } }) => (
                    <div className="h-7">
                      <EstimateDropdown
                        value={value || undefined}
                        onChange={(estimatePoint) => {
                          onChange(estimatePoint);
                          handleFormChange();
                        }}
                        projectId={projectId}
                        buttonVariant="border-with-text"
                        tabIndex={getTabIndex("estimate_point")}
                        placeholder="Estimate"
                      />
                    </div>
                  )}
                />
              )}
              {watch("parent_id") ? (
                <CustomMenu
                  customButton={
                    <button
                      type="button"
                      className="flex cursor-pointer items-center justify-between gap-1 rounded border-[0.5px] border-custom-border-300 px-2 py-1.5 text-xs hover:bg-custom-background-80"
                    >
                      <LayoutPanelTop className="h-3 w-3 flex-shrink-0" />
                      <span className="whitespace-nowrap">
                        {selectedParentIssue &&
                          `${selectedParentIssue.project__identifier}-${selectedParentIssue.sequence_id}`}
                      </span>
                    </button>
                  }
                  placement="bottom-start"
                  tabIndex={getTabIndex("parent_id")}
                >
                  <>
                    <CustomMenu.MenuItem className="!p-1" onClick={() => setParentIssueListModalOpen(true)}>
                      Change parent issue
                    </CustomMenu.MenuItem>
                    <Controller
                      control={control}
                      name="parent_id"
                      render={({ field: { onChange } }) => (
                        <CustomMenu.MenuItem
                          className="!p-1"
                          onClick={() => {
                            onChange(null);
                            handleFormChange();
                          }}
                        >
                          Remove parent issue
                        </CustomMenu.MenuItem>
                      )}
                    />
                  </>
                </CustomMenu>
              ) : (
                <button
                  type="button"
                  className="flex cursor-pointer items-center justify-between gap-1 rounded border-[0.5px] border-custom-border-300 px-2 py-1.5 text-xs hover:bg-custom-background-80"
                  onClick={() => setParentIssueListModalOpen(true)}
                >
                  <LayoutPanelTop className="h-3 w-3 flex-shrink-0" />
                  <span className="whitespace-nowrap">Add parent</span>
                </button>
              )}
              <Controller
                control={control}
                name="parent_id"
                render={({ field: { onChange } }) => (
                  <ParentIssuesListModal
                    isOpen={parentIssueListModalOpen}
                    handleClose={() => setParentIssueListModalOpen(false)}
                    onChange={(issue) => {
                      onChange(issue.id);
                      handleFormChange();
                      setSelectedParentIssue(issue);
                    }}
                    projectId={projectId ?? undefined}
                    issueId={isDraft ? undefined : data?.id}
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-2 border-t-[0.5px] border-custom-border-200">
          <div>
            {!data?.id && (
              <div
                className="inline-flex items-center gap-1.5 cursor-pointer"
                onClick={() => onCreateMoreToggleChange(!isCreateMoreToggleEnabled)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCreateMoreToggleChange(!isCreateMoreToggleEnabled);
                }}
                tabIndex={getTabIndex("create_more")}
                role="button"
              >
                <ToggleSwitch value={isCreateMoreToggleEnabled} onChange={() => {}} size="sm" />
                <span className="text-xs">Create more</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
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
              tabIndex={getTabIndex("discard_button")}
            >
              Discard
            </Button>
            {isDraft && (
              <>
                {data?.id ? (
                  <Button
                    variant="neutral-primary"
                    size="sm"
                    loading={isSubmitting}
                    onClick={handleSubmit((data) => handleFormSubmit({ ...data, is_draft: false }))}
                    tabIndex={getTabIndex("draft_button")}
                  >
                    {isSubmitting ? "Moving" : "Move from draft"}
                  </Button>
                ) : (
                  <Button
                    variant="neutral-primary"
                    size="sm"
                    loading={isSubmitting}
                    onClick={handleSubmit((data) => handleFormSubmit(data, true))}
                    tabIndex={getTabIndex("draft_button")}
                  >
                    {isSubmitting ? "Saving" : "Save as draft"}
                  </Button>
                )}
              </>
            )}
            <Button
              variant="primary"
              type="submit"
              size="sm"
              ref={submitBtnRef}
              loading={isSubmitting}
              tabIndex={isDraft ? getTabIndex("submit_button") : getTabIndex("draft_button")}
            >
              {data?.id ? (isSubmitting ? "Updating" : "Update Issue") : isSubmitting ? "Creating" : "Create Issue"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
});
