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
// helpers
import { getTabIndex } from "@/helpers/issue-modal.helper";
import { getChangedIssuefields } from "@/helpers/issue.helper";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
import { useProjectIssueProperties } from "@/hooks/use-project-issue-properties";
// plane web components
import { IssueAdditionalProperties, IssueTypeSelect } from "@/plane-web/components/issues/issue-modal";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";
// services
import { TIssuePropertyValueErrors, TIssuePropertyValues } from "@/plane-web/types";

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
  issuePropertyValues?: TIssuePropertyValues;
  setIssuePropertyValues?: React.Dispatch<React.SetStateAction<TIssuePropertyValues>>;
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
    issuePropertyValues,
    setIssuePropertyValues,
  } = props;
  // states
  const [labelModal, setLabelModal] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);
  const [gptAssistantModal, setGptAssistantModal] = useState(false);
  const [issuePropertyValueErrors, setIssuePropertyValueErrors] = useState<TIssuePropertyValueErrors>({});
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);
  // router
  const { workspaceSlug, projectId: routeProjectId } = useParams();
  // store hooks
  const { getProjectById } = useProject();
  // plane web hooks
  const { isIssueTypeEnabledForProject, getIssueTypeProperties, getProjectIssueTypes, getProjectDefaultIssueType } =
    useIssueTypes();

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

  const handlePropertyValuesValidation = () => {
    const issueTypeId = watch("type_id");
    // if issue type is not enabled for the project, skip validation
    const isIssueTypeDisplayEnabled =
      !!projectId && isIssueTypeEnabledForProject(workspaceSlug?.toString(), projectId, "ISSUE_TYPE_DISPLAY");
    if (!isIssueTypeDisplayEnabled) return true;
    // if no issue type id or no issue property values, skip validation
    if (!issueTypeId || !issuePropertyValues || Object.keys(issuePropertyValues).length === 0) return true;
    // all properties for the issue type
    const properties = getIssueTypeProperties(issueTypeId);
    // filter all active & required propertyIds
    const activeRequiredPropertyIds = properties
      ?.filter((property) => property.is_active && property.is_required)
      .map((property) => property.id);
    // filter missing required property based on property values
    const missingRequiredPropertyIds = activeRequiredPropertyIds?.filter(
      (propertyId) =>
        propertyId &&
        (!issuePropertyValues[propertyId] ||
          !issuePropertyValues[propertyId].length ||
          issuePropertyValues[propertyId][0].trim() === "")
    );
    // set error state
    setIssuePropertyValueErrors(
      missingRequiredPropertyIds?.reduce((acc, propertyId) => {
        if (propertyId) acc[propertyId] = "REQUIRED";
        return acc;
      }, {} as TIssuePropertyValueErrors)
    );
    // return true if no missing required properties values
    return missingRequiredPropertyIds.length === 0;
  };

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

    // if data is present, set active type id to the type id of the issue
    if (data && data.type_id) {
      setValue("type_id", data.type_id, { shouldValidate: true });
      return;
    }

    // if issue type id is present, return
    if (issueTypeId) return;

    if (!projectId) return;

    const projectIssueTypes = getProjectIssueTypes(projectId, true);
    const defaultIssueType = getProjectDefaultIssueType(projectId);

    // if data is not present, set active type id to the default type id of the project
    if (projectId && projectIssueTypes) {
      if (defaultIssueType?.id) {
        setValue("type_id", defaultIssueType.id, { shouldValidate: true });
      } else {
        const issueTypeId = Object.keys(projectIssueTypes)[0];
        if (issueTypeId) setValue("type_id", issueTypeId, { shouldValidate: true });
      }
    }
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
    if (!handlePropertyValuesValidation()) return;

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

    await onSubmit(submitData, is_draft_issue);

    setGptAssistantModal(false);

    reset({
      ...defaultValues,
      ...(isCreateMoreToggleEnabled ? { ...data } : {}),
      project_id: getValues<"project_id">("project_id"),
      type_id: getValues<"type_id">("type_id"),
      description_html: data?.description_html ?? "<p></p>",
    });
    editorRef?.current?.clearEditor();
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

    setSelectedParentIssue({
      id: issue.id,
      name: issue.name,
      project_id: issue.project_id,
      project__identifier: projectDetails.identifier,
      project__name: projectDetails.name,
      sequence_id: issue.sequence_id,
    } as ISearchIssueResponse);
  }, [watch, getIssueById, getProjectById, selectedParentIssue]);

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
          {/* Don't show project selection if editing an issue */}
          {!data?.id && (
            <div className="flex items-center pt-2 pb-4 gap-x-1">
              <IssueProjectSelect
                control={control}
                disabled={!!data?.sourceIssueId}
                handleFormChange={handleFormChange}
              />
              {projectId && (
                <IssueTypeSelect
                  control={control}
                  projectId={projectId}
                  disabled={!!data?.sourceIssueId}
                  handleFormChange={handleFormChange}
                />
              )}
            </div>
          )}
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
        <div className="px-5 pb-4 space-y-3 max-h-[45vh] overflow-hidden overflow-y-auto vertical-scrollbar scrollbar-sm">
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
          {projectId && (
            <IssueAdditionalProperties
              issueId={data?.id ?? data?.sourceIssueId}
              issueTypeId={watch("type_id")}
              projectId={projectId}
              workspaceSlug={workspaceSlug?.toString()}
              issuePropertyValues={issuePropertyValues}
              issuePropertyValueErrors={issuePropertyValueErrors}
              setIssuePropertyValues={setIssuePropertyValues}
            />
          )}
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
                tabIndex={getTabIndex("create_more")}
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
                {data?.id ? (isSubmitting ? "Updating" : "Update") : isSubmitting ? "Creating" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
});
