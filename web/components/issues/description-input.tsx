import { FC, useState, useEffect } from "react";
import { observer } from "mobx-react";
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
  disabled?: boolean;
  value: string | undefined | null;
  workspaceSlug: string;
  isSubmitting: "submitting" | "submitted" | "saved";
  setIsSubmitting: (value: "submitting" | "submitted" | "saved") => void;
  issueOperations: TIssueOperations;
  projectId: string;
  issueId: string;
};

export const IssueDescriptionInput: FC<IssueDescriptionInputProps> = observer((props) => {
  const { disabled, value, workspaceSlug, setIsSubmitting, issueId, issueOperations, projectId } = props;
  // states
  const [descriptionHTML, setDescriptionHTML] = useState(value);
  const [localIssueDescription, setLocalIssueDescription] = useState({
    id: issueId,
    description_html: typeof value === "string" && value != "" ? value : "<p></p>",
  });
  // store hooks
  const { mentionHighlights, mentionSuggestions } = useMention();
  const { getWorkspaceBySlug } = useWorkspace();
  // hooks
  const debouncedValue = useDebounce(descriptionHTML, 1500);
  // computed values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;

  useEffect(() => {
    if (value) setDescriptionHTML(value);
  }, [value]);

  useEffect(() => {
    if (issueId && value)
      setLocalIssueDescription({
        id: issueId,
        description_html: typeof value === "string" && value != "" ? value : "<p></p>",
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId, value]);

  useEffect(() => {
    if (debouncedValue || debouncedValue === "") {
      setIsSubmitting("submitted");
      issueOperations
        .update(workspaceSlug, projectId, issueId, { description_html: debouncedValue }, false)
        .finally(() => {
          setIsSubmitting("saved");
        });
    }
    // DO NOT Add more dependencies here. It will cause multiple requests to be sent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  if (!descriptionHTML && descriptionHTML !== "") {
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
      rerenderOnPropsChange={localIssueDescription}
      // setShouldShowAlert={setShowAlert}
      // setIsSubmitting={setIsSubmitting}
      dragDropEnabled
      customClassName="min-h-[150px] shadow-sm"
      onChange={(description: Object, description_html: string) => {
        // setShowAlert(true);
        setIsSubmitting("submitting");
        setDescriptionHTML(description_html);
      }}
      mentionSuggestions={mentionSuggestions}
      mentionHighlights={mentionHighlights}
    />
  );
});
