"use client";

import React, { FC, useState, useRef, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
// editor
import { EditorRefApi } from "@plane/editor";
// types
import type { TIssue } from "@plane/types";
// hooks
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { IssueDescriptionEditor, IssueTitleInput } from "@/components/issues/issue-modal/components";
import { ETabIndices } from "@/constants/tab-indices";
// helpers
import { cn } from "@/helpers/common.helper";
import { getTabIndex } from "@/helpers/tab-indices.helper";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useIssueDetail, useProject, useProjectState } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useProjectIssueProperties } from "@/hooks/use-project-issue-properties";

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
  projectId: string;
}

export const IssueFormRoot: FC<IssueFormProps> = observer((props) => {
  const { projectId: defaultProjectId } = props;

  // states
  const [gptAssistantModal, setGptAssistantModal] = useState(false);

  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);
  const issueTitleRef = useRef<HTMLInputElement | null>(null);

  // router
  const { workspaceSlug, projectId: routeProjectId } = useParams();

  // store hooks
  const { getProjectById } = useProject();
  const { isMobile } = usePlatformOS();

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
    defaultValues: { ...defaultValues, project_id: defaultProjectId },
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

  const handleFormChange = () => {};
  const onSubmit = async (formData: Partial<TIssue>) => {};
  const onClose = () => {};

  const handleFormSubmit = async (formData: Partial<TIssue>) => {
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

    const submitData = formData;

    // this condition helps to move the issues from draft to project issues
    if (formData.hasOwnProperty("is_draft")) submitData.is_draft = formData.is_draft;

    await onSubmit(submitData)
      .then(() => {
        setGptAssistantModal(false);
        reset({
          ...defaultValues,
          project_id: getValues<"project_id">("project_id"),
          type_id: getValues<"type_id">("type_id"),
        });
        editorRef?.current?.clearEditor();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const condition =
    (watch("name") && watch("name") !== "") || (watch("description_html") && watch("description_html") !== "<p></p>");

  return (
    <>
      <form onSubmit={handleSubmit((data) => handleFormSubmit(data))}>
        <div className="p-5">
          <h3 className="text-xl font-medium text-custom-text-200 pb-2">{"Create new"} issue</h3>

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
              descriptionHtmlData={watch("description_html")}
            />
          </div>
        </div>
        <div className="px-4 py-3 border-t-[0.5px] border-custom-border-200 shadow-custom-shadow-xs rounded-b-lg">
          <div className="flex items-center justify-end gap-4 py-3">
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

              <Button
                variant="primary"
                type="submit"
                size="sm"
                ref={submitBtnRef}
                loading={isSubmitting}
                tabIndex={getIndex("submit_button")}
              >
                {isSubmitting ? "Creating" : "Created"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
});
