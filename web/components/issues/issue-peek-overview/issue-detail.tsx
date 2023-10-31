import { FC, useCallback, useEffect, useState } from "react";
// packages
import { RichTextEditor } from "@plane/rich-text-editor";
// components
import { IssueReaction } from "./reactions";
// hooks
import { useDebouncedCallback } from "use-debounce";
// types
import { IIssue } from "types";
// services
import { FileService } from "services/file.service";
import { useForm, Controller } from "react-hook-form";
import useReloadConfirmations from "hooks/use-reload-confirmation";

const fileService = new FileService();

interface IPeekOverviewIssueDetails {
  workspaceSlug: string;
  issue: IIssue;
  issueReactions: any;
  user: any;
  issueUpdate: (issue: Partial<IIssue>) => void;
  issueReactionCreate: (reaction: string) => void;
  issueReactionRemove: (reaction: string) => void;
}

export const PeekOverviewIssueDetails: FC<IPeekOverviewIssueDetails> = (props) => {
  const { workspaceSlug, issue, issueReactions, user, issueUpdate, issueReactionCreate, issueReactionRemove } = props;
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");

  const { handleSubmit, watch, reset, control } = useForm<IIssue>({
    defaultValues: {
      name: "",
      description_html: "",
    },
  });

  const { setShowAlert } = useReloadConfirmations();

  useEffect(() => {
    if (!issue) return;

    reset({
      ...issue,
    });
  }, [issue, reset]);

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => {
        setIsSubmitting("saved");
      }, 2000);
    } else if (isSubmitting === "submitting") {
      setShowAlert(true);
    }
  }, [isSubmitting, setShowAlert]);

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!formData?.name || formData?.name.length === 0 || formData?.name.length > 255) return;

      issueUpdate({ name: formData.name ?? "", description_html: formData.description_html });
    },
    [issueUpdate]
  );

  const debouncedIssueFormSave = useDebouncedCallback(async () => {
    handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
  }, 1500);

  return (
    <div className="space-y-4">
      <div className="font-medium text-sm text-custom-text-200">
        {issue?.project_detail?.identifier}-{issue?.sequence_id}
      </div>

      <div className="font-medium text-xl">{watch("name")}</div>

      <div className="space-y-2">
        <div className="relative">
          <Controller
            name="description_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <RichTextEditor
                uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
                deleteFile={fileService.deleteImage}
                value={value}
                onChange={(description: Object, description_html: string) => {
                  setIsSubmitting("submitting");
                  onChange(description_html);
                  debouncedIssueFormSave();
                }}
                customClassName="p-3 min-h-[80px] shadow-sm"
              />
            )}
          />
          <div
            className={`absolute right-5 bottom-5 text-xs text-custom-text-200 border border-custom-border-400 rounded-xl w-[6.5rem] py-1 z-10 flex items-center justify-center ${
              isSubmitting === "saved" ? "fadeOut" : "fadeIn"
            }`}
          >
            {isSubmitting === "submitting" ? "Saving..." : "Saved"}
          </div>
        </div>

        <IssueReaction
          issueReactions={issueReactions}
          user={user}
          issueReactionCreate={issueReactionCreate}
          issueReactionRemove={issueReactionRemove}
        />
      </div>
    </div>
  );
};
