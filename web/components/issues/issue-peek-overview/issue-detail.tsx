import { ChangeEvent, FC, useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
// packages
import { RichTextEditor } from "@plane/rich-text-editor";
// components
import { TextArea } from "@plane/ui";
import { IssueReaction } from "./reactions";
// hooks
import { useDebouncedCallback } from "use-debounce";
import useReloadConfirmations from "hooks/use-reload-confirmation";
import useEditorSuggestions from "hooks/use-editor-suggestions";
// types
import { IIssue } from "types";
// services
import { FileService } from "services/file.service";
import { useMobxStore } from "lib/mobx/store-provider";

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
  // store
  const { user: userStore } = useMobxStore();
  const { currentProjectRole } = userStore;
  const isAllowed = [5, 10].includes(currentProjectRole || 0);
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  const [characterLimit, setCharacterLimit] = useState(false);
  // hooks
  const { setShowAlert } = useReloadConfirmations();
  const editorSuggestions = useEditorSuggestions(workspaceSlug, issue.project_detail.id);

  const {
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<IIssue>({
    defaultValues: {
      name: "",
      description_html: "",
    },
  });

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!formData?.name || formData?.name.length === 0 || formData?.name.length > 255) return;

      await issueUpdate({
        ...issue,
        name: formData.name ?? "",
        description_html: formData.description_html ?? "<p></p>",
      });
    },
    [issue, issueUpdate]
  );

  const debouncedIssueDescription = useDebouncedCallback(async (_data: any) => {
    issueUpdate({ ...issue, description_html: _data });
  }, 1500);

  const debouncedTitleSave = useDebouncedCallback(async () => {
    handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
  }, 1500);

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

  // reset form values
  useEffect(() => {
    if (!issue) return;

    reset({
      ...issue,
    });
  }, [issue, reset]);

  return (
    <>
      <span className="font-medium text-base text-custom-text-400">
        {issue?.project_detail?.identifier}-{issue?.sequence_id}
      </span>

      <div className="relative">
        {isAllowed ? (
          <Controller
            name="name"
            control={control}
            render={({ field: { value, onChange } }) => (
              <TextArea
                id="name"
                name="name"
                value={value}
                placeholder="Enter issue name"
                onFocus={() => setCharacterLimit(true)}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  setCharacterLimit(false);
                  setIsSubmitting("submitting");
                  debouncedTitleSave();
                  onChange(e.target.value);
                }}
                required={true}
                className="min-h-10 block w-full resize-none overflow-hidden rounded border-none bg-transparent  text-xl outline-none ring-0 focus:ring-1 focus:ring-custom-primary !p-0 focus:!px-3 focus:!py-2"
                hasError={Boolean(errors?.description)}
                role="textbox"
                disabled={!true}
              />
            )}
          />
        ) : (
          <h4 className="break-words text-2xl font-semibold">{issue.name}</h4>
        )}
        {characterLimit && true && (
          <div className="pointer-events-none absolute bottom-1 right-1 z-[2] rounded bg-custom-background-100 text-custom-text-200 p-0.5 text-xs">
            <span className={`${watch("name").length === 0 || watch("name").length > 255 ? "text-red-500" : ""}`}>
              {watch("name").length}
            </span>
            /255
          </div>
        )}
      </div>
      <span>{errors.name ? errors.name.message : null}</span>
      <RichTextEditor
        uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
        deleteFile={fileService.deleteImage}
        value={issue?.description_html}
        debouncedUpdatesEnabled={false}
        onChange={(description: Object, description_html: string) => {
          debouncedIssueDescription(description_html);
        }}
        customClassName="mt-0"
        mentionSuggestions={editorSuggestions.mentionSuggestions}
        mentionHighlights={editorSuggestions.mentionHighlights}
      />
      <IssueReaction
        issueReactions={issueReactions}
        user={user}
        issueReactionCreate={issueReactionCreate}
        issueReactionRemove={issueReactionRemove}
      />
    </>
  );
};
