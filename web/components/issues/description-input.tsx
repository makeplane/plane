import { FC, useCallback, useEffect, useState } from "react";
import debounce from "lodash/debounce";
import { Controller, useForm } from "react-hook-form";

// types
import { TIssue } from "@plane/types";
import { Loader } from "@plane/ui";
// hooks
import { useWorkspace } from "@/hooks/store";
// components
import { RichTextEditor } from "components/editor/rich-text-editor";
import { RichTextReadOnlyEditor } from "components/editor/rich-text-read-only-editor";
import { TIssueOperations } from "components/issues/issue-detail";

export type IssueDescriptionInputProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  initialValue: string | undefined;
  disabled?: boolean;
  issueOperations: TIssueOperations;
  setIsSubmitting: (initialValue: "submitting" | "submitted" | "saved") => void;
  swrIssueDetails: TIssue | null | undefined;
};

export const IssueDescriptionInput: FC<IssueDescriptionInputProps> = (props) => {
  const {
    workspaceSlug,
    projectId,
    issueId,
    disabled,
    swrIssueDetails,
    initialValue,
    issueOperations,
    setIsSubmitting,
  } = props;

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
    [handleSubmit]
  );

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
                initialValue={localIssueDescription.description_html ?? "<p></p>"}
                value={swrIssueDetails?.description_html ?? null}
                workspaceSlug={workspaceSlug}
                workspaceId={workspaceId}
                projectId={projectId}
                dragDropEnabled
                customClassName="min-h-[150px] shadow-sm border border-custom-border-200"
                onChange={(_description: object, description_html: string) => {
                  setIsSubmitting("submitting");
                  onChange(description_html);
                  debouncedFormSave();
                }}
              />
            ) : (
              <RichTextReadOnlyEditor
                initialValue={localIssueDescription.description_html ?? ""}
                customClassName="!p-0 !pt-2 text-custom-text-200"
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
};
