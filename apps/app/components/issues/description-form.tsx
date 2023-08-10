import { FC, useCallback, useEffect, useState } from "react";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// hooks
import useReloadConfirmations from "hooks/use-reload-confirmation";
// components
import { TextArea } from "components/ui";

// types
import { IIssue } from "types";
import Tiptap from "components/tiptap";

export interface IssueDescriptionFormValues {
  name: string;
  description: any;
  description_html: string;
}

export interface IssueDetailsProps {
  issue: {
    name: string;
    description: string;
    description_html: string;
  };
  handleFormSubmit: (value: IssueDescriptionFormValues) => Promise<void>;
  isAllowed: boolean;
}

export const IssueDescriptionForm: FC<IssueDetailsProps> = ({
  issue,
  handleFormSubmit,
  isAllowed,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characterLimit, setCharacterLimit] = useState(false);

  const { setShowAlert } = useReloadConfirmations();

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    register,
    control,
    formState: { errors },
  } = useForm<IIssue>({
    defaultValues: {
      name: "",
      description: "",
      description_html: "",
    },
  });

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<IIssue>) => {
      console.log("formdata", formData)
      if (!formData?.name || formData?.name.length === 0 || formData?.name.length > 255) return;

      await handleFormSubmit({
        name: formData.name ?? "",
        description: formData.description ?? "",
        description_html: formData.description_html ?? "<p></p>",
      });
    },
    [handleFormSubmit]
  );

  // reset form values
  useEffect(() => {
    if (!issue) return;

    reset({
      ...issue,
    });
  }, [issue, reset]);

  return (
    <div className="relative">
      <div className="relative">
        <TextArea
          id="name"
          name="name"
          placeholder="Enter issue name"
          register={register}
          onFocus={() => setCharacterLimit(true)}
          onBlur={() => {
            setCharacterLimit(false);

            setIsSubmitting(true);
            handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting(false));
          }}
          required={true}
          className="min-h-10 block w-full resize-none overflow-hidden rounded border-none bg-transparent px-3 py-2 text-xl outline-none ring-0 focus:ring-1 focus:ring-custom-primary"
          role="textbox"
          disabled={!isAllowed}
        />
        {characterLimit && (
          <div className="pointer-events-none absolute bottom-1 right-1 z-[2] rounded bg-custom-background-100 text-custom-text-200 p-0.5 text-xs">
            <span
              className={`${watch("name").length === 0 || watch("name").length > 255 ? "text-red-500" : ""
                }`}
            >
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
          render={({ field: { value, onChange } }) => {
            if (!value && !watch("description_html")) return <></>;

            return (
              <Tiptap
                value={
                  !value || value === "" || (typeof value === "object" && Object.keys(value).length === 0)
                    ? watch("description_html")
                    : value
                }
                debouncedUpdatesEnabled={true}
                setIsSubmitting={setIsSubmitting}
                customClassName="min-h-[150px]"
                editorContentCustomClassNames="pt-9"
                onChange={(description: Object, description_html: string) => {
                  setIsSubmitting(true);
                  onChange(description_html);
                  setValue("description", description);
                  handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting(false));
                }}
              />
            );
          }}
        />
        <div className="absolute right-5 top-5 text-xs text-custom-text-200 border border-custom-border-400 rounded-xl w-[6.5rem] py-1 z-10 flex items-center justify-center">
          {isSubmitting ? "Saving..." : "Saved"}
        </div>
      </div>
    </div>
  );
};
