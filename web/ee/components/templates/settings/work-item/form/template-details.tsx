import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TWorkItemTemplateForm } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
// local imports
import { validateWhitespace } from "./common";

export const TemplateDetails = observer(() => {
  // plane hooks
  const { t } = useTranslation();
  // form context
  const {
    control,
    formState: { errors },
  } = useFormContext<TWorkItemTemplateForm>();

  return (
    <>
      {/* Template Name */}
      <div>
        <Controller
          control={control}
          name="template.name"
          rules={{
            validate: (value) => {
              const result = validateWhitespace(value);
              if (result) {
                return t(result);
              }
              return undefined;
            },
            required: "Template name is required",
            maxLength: {
              value: 255,
              message: "Template name should be less than 255 characters",
            },
          }}
          render={({ field: { value, onChange, ref } }) => (
            <Input
              id="template.name"
              name="template.name"
              type="text"
              value={value}
              onChange={onChange}
              ref={ref}
              placeholder="Name your work-item template."
              className="w-full text-lg font-bold p-0"
              mode="true-transparent"
              inputSize="md"
              hasError={Boolean(errors.template?.name)}
              autoFocus
            />
          )}
        />
        {errors?.template?.name && typeof errors.template.name.message === "string" && (
          <span className="text-xs font-medium text-red-500">{errors.template.name.message}</span>
        )}
      </div>
      {/* Template Description */}
      <div className="space-y-1">
        <Controller
          name="template.description_html"
          control={control}
          render={({ field: { value, onChange, ref } }) => (
            <TextArea
              id="template.description_html"
              name="template.description_html"
              value={value}
              onChange={onChange}
              ref={ref}
              placeholder="Describe when and how to use this template."
              className="w-full min-h-[80px] p-0 resize-none"
              mode="true-transparent"
              textAreaSize="md"
            />
          )}
        />
      </div>
    </>
  );
});
