"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// types
import { TIssue } from "@plane/types";
// ui
import { Loader } from "@plane/ui";
// components
import { RichTextEditor, RichTextReadOnlyEditor } from "@/components/editor";
import { TIssueOperations } from "@/components/issues/issue-detail";
// helpers
import { getDescriptionPlaceholder } from "@/helpers/issue.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
import { EditorRefApi } from "@plane/rich-text-editor";
import page from "app/page";
import { useIssueDescription } from "@/hooks/use-issue-description";
import { PageContentLoader } from "../pages";

export type IssueDescriptionInputProps = {
  containerClassName?: string;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  initialValue: string | undefined;
  disabled?: boolean;
  issueOperations: TIssueOperations;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  isSubmitting: "submitting" | "submitted" | "saved";
  setIsSubmitting: (initialValue: "submitting" | "submitted" | "saved") => void;
  swrIssueDescription: string | null | undefined;
};

export const IssueDescriptionInput: FC<IssueDescriptionInputProps> = observer((props) => {
  const {
    containerClassName,
    workspaceSlug,
    projectId,
    issueId,
    disabled,
    initialValue,
    issueOperations,
    isSubmitting,
    setIsSubmitting,
    placeholder,
  } = props;

  const editorRef = useRef<EditorRefApi>(null);

  const { handleDescriptionChange, isDescriptionReady, issueDescriptionYJS } = useIssueDescription({
    editorRef,
    projectId,
    updateIssueDescription: issueOperations.update,
    issueId,
    setIsSubmitting,
    isSubmitting,
    canUpdateDescription: true,
    workspaceSlug,
  });

  const { handleSubmit, reset, control } = useForm<TIssue>({
    defaultValues: {
      description_html: initialValue,
    },
  });

  const [localIssueDescription, setLocalIssueDescription] = useState({
    id: issueId,
    description_html: initialValue,
  });

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<TIssue>) => {
      await issueOperations.update(workspaceSlug, projectId, issueId, {
        description_html: formData.description_html ?? "<p></p>",
      });
    },
    [workspaceSlug, projectId, issueId, issueOperations]
  );

  const { getWorkspaceBySlug } = useWorkspace();
  // computed values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;

  // reset form values
  useEffect(() => {
    if (!issueId) return;
    reset({
      id: issueId,
      description_html: initialValue === "" ? "<p></p>" : initialValue,
    });
    setLocalIssueDescription({
      id: issueId,
      description_html: initialValue === "" ? "<p></p>" : initialValue,
    });
  }, [initialValue, issueId, reset]);

  // ADDING handleDescriptionFormSubmit TO DEPENDENCY ARRAY PRODUCES ADVERSE EFFECTS
  // TODO: Verify the exhaustive-deps warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFormSave = useCallback(
    debounce(async () => {
      handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
    }, 1500),
    [handleSubmit, issueId]
  );

  if (!issueDescriptionYJS || !isDescriptionReady) return <PageContentLoader />;

  return (
    <>
      {localIssueDescription.description_html ? (
        <Controller
          name="description_html"
          control={control}
          render={({ field: { onChange } }) =>
            !disabled ? (
              <RichTextEditor
                id={issueId}
                ref={editorRef}
                initialValue={localIssueDescription.description_html ?? "<p></p>"}
                value={issueDescriptionYJS}
                workspaceSlug={workspaceSlug}
                workspaceId={workspaceId}
                projectId={projectId}
                dragDropEnabled
                onCheck={handleDescriptionChange}
                placeholder={
                  placeholder ? placeholder : (isFocused, value) => getDescriptionPlaceholder(isFocused, value)
                }
                containerClassName={containerClassName}
              />
            ) : (
              <RichTextReadOnlyEditor
                initialValue={localIssueDescription.description_html ?? ""}
                containerClassName={containerClassName}
              />
            )
          }
        />
      ) : (
        <Loader>
          <Loader.Item height="150px" />
        </Loader>
      )}
    </>
  );
});
