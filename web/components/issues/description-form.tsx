import { ChangeEvent, FC, useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
// hooks
import useReloadConfirmations from "hooks/use-reload-confirmation";
import debounce from "lodash/debounce";
// components
import { TextArea } from "@plane/ui";
import { RichTextEditor } from "@plane/rich-text-editor";
// types
import { IIssue } from "types";
// services
import { FileService } from "services/file.service";
import useEditorSuggestions from "hooks/use-editor-suggestions";

export interface IssueDescriptionFormValues {
  name: string;
  description_html: string;
}

export interface IssueDetailsProps {
  issue: {
    name: string;
    description_html: string;
    project_id?: string;
  };
  workspaceSlug: string;
  handleFormSubmit: (value: IssueDescriptionFormValues) => Promise<void>;
  isAllowed: boolean;
}

const fileService = new FileService();

export const IssueDescriptionForm: FC<IssueDetailsProps> = (props) => {
  const { issue, handleFormSubmit, workspaceSlug, isAllowed } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  const [characterLimit, setCharacterLimit] = useState(false);

  const { setShowAlert } = useReloadConfirmations();

  const editorSuggestion = useEditorSuggestions();

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

  const [localTitleValue, setLocalTitleValue] = useState("");
  const issueTitleCurrentValue = watch("name");
  useEffect(() => {
    if (localTitleValue === "" && issueTitleCurrentValue !== "") {
      setLocalTitleValue(issueTitleCurrentValue);
    }
  }, [issueTitleCurrentValue, localTitleValue]);

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!formData?.name || formData?.name.length === 0 || formData?.name.length > 255) return;

      await handleFormSubmit({
        name: formData.name ?? "",
        description_html: formData.description_html ?? "<p></p>",
      });
    },
    [handleFormSubmit]
  );

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

  const debouncedFormSave = debounce(async () => {
    handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
  }, 1500);

  return (
    <div className="relative">
      <div className="relative">
        {isAllowed ? (
          <Controller
            name="name"
            control={control}
            render={({ field: { onChange } }) => (
              <TextArea
                value={localTitleValue}
                id="name"
                name="name"
                placeholder="Enter issue name"
                onFocus={() => setCharacterLimit(true)}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  setCharacterLimit(false);
                  setIsSubmitting("submitting");
                  setLocalTitleValue(e.target.value);
                  onChange(e.target.value);
                  debouncedFormSave();
                }}
                required
                className="min-h-10 block w-full resize-none overflow-hidden rounded border-none bg-transparent px-3 py-2 text-xl outline-none ring-0 focus:ring-1 focus:ring-custom-primary"
                hasError={Boolean(errors?.description)}
                role="textbox"
                disabled={!isAllowed}
              />
            )}
          />
        ) : (
          <h4 className="break-words text-2xl font-semibold">{issue.name}</h4>
        )}
        {characterLimit && isAllowed && (
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
          render={({ field: { value, onChange } }) => (
            <RichTextEditor
              cancelUploadImage={fileService.cancelUpload}
              uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
              deleteFile={fileService.deleteImage}
              restoreFile={fileService.restoreImage}
              value={value}
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
              mentionSuggestions={editorSuggestion.mentionSuggestions}
              mentionHighlights={editorSuggestion.mentionHighlights}
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
    </div>
  );
};
