import { FC, useState, useEffect } from "react";
// components
import { Loader } from "@plane/ui";
import { RichReadOnlyEditor, RichTextEditor } from "@plane/rich-text-editor";
// store hooks
import { useMention, useWorkspace } from "hooks/store";
// services
import { FileService } from "services/file.service";
const fileService = new FileService();
// types
import { TIssueOperations } from "./issue-detail";
// hooks
import useDebounce from "hooks/use-debounce";

export type IssueDescriptionInputProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  value: string | undefined;
  initialValue: string | undefined;
  disabled?: boolean;
  issueOperations: TIssueOperations;
  setIsSubmitting: (value: "submitting" | "submitted" | "saved") => void;
};

export const IssueDescriptionInput: FC<IssueDescriptionInputProps> = (props) => {
  const { workspaceSlug, projectId, issueId, value, initialValue, disabled, issueOperations, setIsSubmitting } = props;
  // states
  const [descriptionHTML, setDescriptionHTML] = useState(value);
  // store hooks
  const { mentionHighlights, mentionSuggestions } = useMention();
  const { getWorkspaceBySlug } = useWorkspace();
  // hooks
  const debouncedValue = useDebounce(descriptionHTML, 1500);
  // computed values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;

  useEffect(() => {
    setDescriptionHTML(value);
  }, [value]);

  useEffect(() => {
    if (debouncedValue && debouncedValue !== value) {
      issueOperations
        .update(workspaceSlug, projectId, issueId, { description_html: debouncedValue }, false)
        .finally(() => {
          setIsSubmitting("submitted");
        });
    }
    // DO NOT Add more dependencies here. It will cause multiple requests to be sent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  if (!descriptionHTML) {
    return (
      <Loader>
        <Loader.Item height="150px" />
      </Loader>
    );
  }

  if (disabled) {
    return (
      <RichReadOnlyEditor
        value={descriptionHTML}
        customClassName="!p-0 !pt-2 text-custom-text-200"
        noBorder={disabled}
        mentionHighlights={mentionHighlights}
      />
    );
  }

  return (
    <RichTextEditor
      cancelUploadImage={fileService.cancelUpload}
      uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
      deleteFile={fileService.getDeleteImageFunction(workspaceId)}
      restoreFile={fileService.getRestoreImageFunction(workspaceId)}
      value={descriptionHTML}
      initialValue={initialValue}
      dragDropEnabled
      customClassName="min-h-[150px] shadow-sm"
      onChange={(description: Object, description_html: string) => {
        setIsSubmitting("submitting");
        setDescriptionHTML(description_html === "" ? "<p></p>" : description_html);
      }}
      mentionSuggestions={mentionSuggestions}
      mentionHighlights={mentionHighlights}
    />
  );
};
