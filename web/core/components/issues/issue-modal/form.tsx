"use client";

import React, { FC, useState, useRef, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
// editor
import { EditorRefApi } from "@plane/editor";
// types
import type { TIssue, ISearchIssueResponse } from "@plane/types";
// hooks
import { Button, ToggleSwitch, TOAST_TYPE, setToast } from "@plane/ui";
// components
import {
  IssueDefaultProperties,
  IssueDescriptionEditor,
  IssueParentTag,
  IssueProjectSelect,
  IssueTitleInput,
} from "@/components/issues/issue-modal/components";
import { CreateLabelModal } from "@/components/labels";
import { ETabIndices } from "@/constants/tab-indices";
// helpers
import { cn } from "@/helpers/common.helper";
import { getChangedIssuefields } from "@/helpers/issue.helper";
import { getTabIndex } from "@/helpers/tab-indices.helper";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useIssueDetail, useProject, useProjectState } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useProjectIssueProperties } from "@/hooks/use-project-issue-properties";
// plane web components
import { IssueAdditionalProperties, IssueTypeSelect } from "@/plane-web/components/issues/issue-modal";

const defaultValues: Partial<TIssue> = {
  project_id: "",
  type_id: null,
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
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);
  const [gptAssistantModal, setGptAssistantModal] = useState(false);

  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);

  // router
  const { workspaceSlug, projectId: routeProjectId } = useParams();

  // store hooks
  const { getProjectById } = useProject();
  const { getIssueTypeIdOnProjectChange, getActiveAdditionalPropertiesLength, handlePropertyValuesValidation } =
    useIssueModal();
  const { isMobile } = usePlatformOS();

  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { fetchCycles } = useProjectIssueProperties();
  const { getStateById } = useProjectState();

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
  const activeAdditionalPropertiesLength = getActiveAdditionalPropertiesLength({
    projectId: projectId,
    workspaceSlug: workspaceSlug?.toString(),
    watch: watch,
  });

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

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
        };

    // this condition helps to move the issues from draft to project issues
    if (formData.hasOwnProperty("is_draft")) submitData.is_draft = formData.is_draft;

    await onSubmit(submitData, is_draft_issue)
      .then(() => {
        setGptAssistantModal(false);
        reset({
          ...defaultValues,
          ...(isCreateMoreToggleEnabled ? { ...data } : {}),
          project_id: getValues<"project_id">("project_id"),
          type_id: getValues<"type_id">("type_id"),
          description_html: data?.description_html ?? "<p></p>",
        });
        editorRef?.current?.clearEditor();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const condition =
    (watch("name") && watch("name") !== "") || (watch("description_html") && watch("description_html") !== "<p></p>");

  const handleFormChange = () => {
    if (!onChange) return;

    if (isDirty && condition) onChange(watch());
    else onChange(null);
  };

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

    setSelectedParentIssue({
      id: issue.id,
      name: issue.name,
      project_id: issue.project_id,
      project__identifier: projectDetails.identifier,
      project__name: projectDetails.name,
      sequence_id: issue.sequence_id,
      type_id: issue.type_id,
      state__color: stateDetails?.color,
    } as ISearchIssueResponse);
  }, [watch, getIssueById, getProjectById, selectedParentIssue, getStateById]);

  // executing this useEffect when isDirty changes
  useEffect(() => {
    if (!onChange) return;

    if (isDirty && condition) onChange(watch());
    else onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  return (
    <>
      {projectId && (
        <CreateLabelModal
          isOpen={labelModal}
          handleClose={() => setLabelModal(false)}
          projectId={projectId}
          onSuccess={(response) => {
            setValue<"label_ids">("label_ids", [...watch("label_ids"), response.id]);
            handleFormChange();
          }}
        />
      )}
      <form onSubmit={handleSubmit((data) => handleFormSubmit(data))}>
        <div className="p-5">
          <h3 className="text-xl font-medium text-custom-text-200 pb-2">{data?.id ? "Update" : "Create new"} issue</h3>
          {/* Disable project selection if editing an issue */}
          <div className="flex items-center pt-2 pb-4 gap-x-1">
            <IssueProjectSelect
              control={control}
              disabled={!!data?.id || !!data?.sourceIssueId}
              handleFormChange={handleFormChange}
            />
            {projectId && (
              <IssueTypeSelect
                control={control}
                projectId={projectId}
                disabled={!!data?.sourceIssueId}
                handleFormChange={handleFormChange}
                renderChevron
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
              errors={errors}
              handleFormChange={handleFormChange}
            />
          </div>
        </div>
        <div
          className={cn(
            "pb-4 space-y-3",
            activeAdditionalPropertiesLength > 4 &&
              "max-h-[45vh] overflow-hidden overflow-y-auto vertical-scrollbar scrollbar-sm"
          )}
        >
          <div className="px-5">
            <IssueDescriptionEditor
              control={control}
              issueName={watch("name")}
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
              onClose={onClose}
            />
          </div>
          <div
            className={cn(
              "px-5",
              activeAdditionalPropertiesLength <= 4 &&
                "max-h-[25vh] overflow-hidden overflow-y-auto vertical-scrollbar scrollbar-sm"
            )}
          >
            {projectId && (
              <IssueAdditionalProperties
                issueId={data?.id ?? data?.sourceIssueId}
                issueTypeId={watch("type_id")}
                projectId={projectId}
                workspaceSlug={workspaceSlug?.toString()}
              />
            )}
          </div>
        </div>
        <div className="px-4 py-3 border-t-[0.5px] border-custom-border-200 shadow-custom-shadow-xs rounded-b-lg">
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
          <div className="flex items-center justify-end gap-4 py-3">
            {!data?.id && (
              <div
                className="inline-flex items-center gap-1.5 cursor-pointer"
                onClick={() => onCreateMoreToggleChange(!isCreateMoreToggleEnabled)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCreateMoreToggleChange(!isCreateMoreToggleEnabled);
                }}
                tabIndex={getIndex("create_more")}
                role="button"
              >
                <ToggleSwitch value={isCreateMoreToggleEnabled} onChange={() => {}} size="sm" />
                <span className="text-xs">Create more</span>
              </div>
            )}
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
                tabIndex={getIndex("discard_button")}
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
                      tabIndex={getIndex("draft_button")}
                    >
                      {isSubmitting ? "Moving" : "Move from draft"}
                    </Button>
                  ) : (
                    <Button
                      variant="neutral-primary"
                      size="sm"
                      loading={isSubmitting}
                      onClick={handleSubmit((data) => handleFormSubmit(data, true))}
                      tabIndex={getIndex("draft_button")}
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
                tabIndex={isDraft ? getIndex("submit_button") : getIndex("draft_button")}
              >
                {data?.id ? (isSubmitting ? "Updating" : "Update") : isSubmitting ? "Creating" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
});
