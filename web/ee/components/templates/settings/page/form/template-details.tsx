import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TPageTemplateForm } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
// plane web imports
import { validateWhitespaceI18n } from "@/plane-web/components/templates/settings/common";

export const TemplateDetails = observer(() => {
  // plane hooks
  const { t } = useTranslation();
  // form context
  const {
    control,
    formState: { errors },
  } = useFormContext<TPageTemplateForm>();

  return (
    <>
      {/* Template Name */}
      <div>
        <Controller
          control={control}
          name="template.name"
          rules={{
            validate: (value) => {
              const result = validateWhitespaceI18n(value);
              if (result) {
                return t(result);
              }
              return undefined;
            },
            required: t("templates.settings.form.page.template.name.validation.required"),
            maxLength: {
              value: 255,
              message: t("templates.settings.form.page.template.name.validation.maxLength"),
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
              placeholder={t("templates.settings.form.page.template.name.placeholder")}
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
          name="template.short_description"
          control={control}
          render={({ field: { value, onChange, ref } }) => (
            <TextArea
              id="template.short_description"
              name="template.short_description"
              value={value}
              onChange={onChange}
              ref={ref}
              placeholder={t("templates.settings.form.page.template.description.placeholder")}
              className="w-full text-base min-h-[80px] p-0 resize-none"
              mode="true-transparent"
              textAreaSize="md"
            />
          )}
        />
      </div>
    </>
  );
});
