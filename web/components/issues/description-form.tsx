import { ChangeEvent, FC, useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
// hooks
import useReloadConfirmations from "hooks/use-reload-confirmation";
import { useDebouncedCallback } from "use-debounce";
// components
import { TextArea } from "@plane/ui";
import { RichTextEditor } from "@plane/rich-text-editor";
// types
import { IIssue } from "types";
// services
import { FileService } from "services/file.service";

export interface IssueDescriptionFormValues {
  name: string;
  description_html: string;
}

export interface IssueDetailsProps {
  issue: {
    name: string;
    description_html: string;
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

  const debouncedTitleSave = useDebouncedCallback(async () => {
    handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
  }, 1500);

  return (
    <div className="relative">
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
              uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
              deleteFile={fileService.deleteImage}
              value={value}
              debouncedUpdatesEnabled={true}
              setShouldShowAlert={setShowAlert}
              setIsSubmitting={setIsSubmitting}
              customClassName={isAllowed ? "min-h-[150px] shadow-sm" : "!p-0 !pt-2 text-custom-text-200"}
              noBorder={!isAllowed}
              onChange={(description: Object, description_html: string) => {
                setShowAlert(true);
                setIsSubmitting("submitting");
                onChange(description_html);
                handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
              }}
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
