import { ChangeEvent, FC, useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import debounce from "lodash/debounce";
// packages
import { RichTextEditor } from "@plane/rich-text-editor";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useReloadConfirmations from "hooks/use-reload-confirmation";
import useEditorSuggestions from "hooks/use-editor-suggestions";
// components
import { IssuePeekOverviewReactions } from "components/issues";
// ui
import { TextArea } from "@plane/ui";
// types
import { IIssue, IUser } from "types";
// services
import { FileService } from "services/file.service";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

const fileService = new FileService();

interface IPeekOverviewIssueDetails {
  workspaceSlug: string;
  issue: IIssue;
  issueReactions: any;
  user: IUser | null;
  issueUpdate: (issue: Partial<IIssue>) => void;
  issueReactionCreate: (reaction: string) => void;
  issueReactionRemove: (reaction: string) => void;
  isSubmitting: "submitting" | "submitted" | "saved";
  setIsSubmitting: (value: "submitting" | "submitted" | "saved") => void;
}

export const PeekOverviewIssueDetails: FC<IPeekOverviewIssueDetails> = (props) => {
  const {
    workspaceSlug,
    issue,
    issueReactions,
    user,
    issueUpdate,
    issueReactionCreate,
    issueReactionRemove,
    isSubmitting,
    setIsSubmitting,
  } = props;
  // store
  const { user: userStore } = useMobxStore();
  const { currentProjectRole } = userStore;
  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserWorkspaceRoles.MEMBER;
  // states
  const [characterLimit, setCharacterLimit] = useState(false);
  // hooks
  const { setShowAlert } = useReloadConfirmations();
  const editorSuggestions = useEditorSuggestions();

  const {
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<IIssue>({
    defaultValues: {
      name: issue.name,
      description_html: issue.description_html,
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

  const [localTitleValue, setLocalTitleValue] = useState("");
  const [localIssueDescription, setLocalIssueDescription] = useState({
    id: issue.id,
    description_html: issue.description_html,
  });

  // adding issue.description_html or issue.name to dependency array causes
  // editor rerendering on every save
  useEffect(() => {
    if (issue.id) {
      setLocalIssueDescription({ id: issue.id, description_html: issue.description_html });
      setLocalTitleValue(issue.name);
    }
  }, [issue.id]);

  const debouncedFormSave = debounce(async () => {
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
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

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
            render={({ field: { onChange } }) => (
              <TextArea
                id="name"
                name="name"
                value={localTitleValue}
                placeholder="Enter issue name"
                onFocus={() => setCharacterLimit(true)}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  setCharacterLimit(false);
                  setIsSubmitting("submitting");
                  setLocalTitleValue(e.target.value);
                  onChange(e.target.value);
                  debouncedFormSave();
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
      <div className="relative">
        <Controller
          name="description_html"
          control={control}
          render={({ field: { onChange } }) => (
            <RichTextEditor
              cancelUploadImage={fileService.cancelUpload}
              uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
              deleteFile={fileService.deleteImage}
              restoreFile={fileService.restoreImage}
              value={localIssueDescription.description_html}
              rerenderOnPropsChange={localIssueDescription}
              setShouldShowAlert={setShowAlert}
              setIsSubmitting={setIsSubmitting}
              dragDropEnabled
              customClassName={isAllowed ? "min-h-[150px] shadow-sm" : "!p-0 !pt-2 text-custom-text-200"}
              noBorder={!isAllowed}
              onChange={(description: Object, description_html: string) => {
                setShowAlert(true);
                setIsSubmitting("submitting");
                onChange(description_html);
                debouncedFormSave();
              }}
              mentionSuggestions={editorSuggestions.mentionSuggestions}
              mentionHighlights={editorSuggestions.mentionHighlights}
            />
          )}
        />
      </div>
      <IssuePeekOverviewReactions
        issueReactions={issueReactions}
        user={user}
        issueReactionCreate={issueReactionCreate}
        issueReactionRemove={issueReactionRemove}
      />
    </>
  );
};
