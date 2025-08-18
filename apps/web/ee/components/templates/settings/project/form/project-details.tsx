import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TProjectTemplateForm } from "@plane/types";
import { CustomEmojiIconPicker, EmojiIconPickerTypes, Input, Logo, TextArea } from "@plane/ui";
import { convertHexEmojiToDecimal, getFileURL } from "@plane/utils";
// components
import { ImagePickerPopover } from "@/components/core/image-picker-popover";
// plane web components
import { validateWhitespaceI18n } from "@/plane-web/components/templates/settings/common";

export const ProjectDetails = observer(() => {
  // states
  const [isOpen, setIsOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // form context
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<TProjectTemplateForm>();
  // derived values
  const coverImage = watch("project.cover_image_url");

  return (
    <>
      <div className="group relative h-40 w-full rounded-lg bg-custom-background-80">
        {/* Cover Image */}
        {coverImage && (
          <img
            src={getFileURL(coverImage)}
            className="absolute left-0 top-0 h-full w-full rounded-lg object-cover"
            alt={t("project_cover_image_alt")}
          />
        )}
        <div className="absolute bottom-2 right-2">
          <Controller
            name="project.cover_image_url"
            control={control}
            render={({ field: { value, onChange } }) => (
              <ImagePickerPopover
                label={t("change_cover")}
                onChange={onChange}
                control={control}
                value={value ?? null}
              />
            )}
          />
        </div>
        {/* Logo */}
        <div className="absolute -bottom-[22px] left-6">
          <Controller
            name="project.logo_props"
            control={control}
            render={({ field: { value, onChange } }) => (
              <CustomEmojiIconPicker
                isOpen={isOpen}
                handleToggle={(val: boolean) => setIsOpen(val)}
                className="flex items-center justify-center"
                buttonClassName="flex items-center justify-center"
                label={
                  <span className="grid h-11 w-11 place-items-center rounded-md bg-custom-background-80">
                    <Logo logo={value} size={20} />
                  </span>
                }
                onChange={(val) => {
                  let logoValue = {};

                  if (val?.type === "emoji")
                    logoValue = {
                      value: convertHexEmojiToDecimal(val.value.unified),
                      url: val.value.imageUrl,
                    };
                  else if (val?.type === "icon") logoValue = val.value;

                  onChange({
                    in_use: val?.type,
                    [val?.type]: logoValue,
                  });
                  setIsOpen(false);
                }}
                defaultIconColor={value.in_use && value.in_use === "icon" ? value.icon?.color : undefined}
                defaultOpen={
                  value.in_use && value.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON
                }
              />
            )}
          />
        </div>
      </div>
      {/* Project Title */}
      <div className="mt-8">
        <Controller
          control={control}
          name="project.name"
          rules={{
            validate: (value) => {
              const result = validateWhitespaceI18n(value);
              if (result) {
                return t(result);
              }
              return undefined;
            },
            required: t("templates.settings.form.project.name.validation.required"),
            maxLength: {
              value: 255,
              message: t("templates.settings.form.project.name.validation.maxLength"),
            },
          }}
          render={({ field: { value, onChange, ref } }) => (
            <Input
              id="project.name"
              name="project.name"
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              ref={ref}
              hasError={Boolean(errors.project?.name)}
              placeholder={t("templates.settings.form.project.name.placeholder")}
              className="w-full text-lg font-bold p-0"
              mode="true-transparent"
              inputSize="md"
            />
          )}
        />
        {errors?.project?.name && typeof errors.project.name.message === "string" && (
          <span className="text-xs font-medium text-red-500">{errors.project.name.message}</span>
        )}
      </div>

      {/* Project Description */}
      <div className="space-y-1">
        <Controller
          name="project.description"
          control={control}
          render={({ field: { value, onChange, ref } }) => (
            <TextArea
              id="project.description"
              name="project.description"
              value={value}
              onChange={onChange}
              ref={ref}
              placeholder={t("templates.settings.form.project.template.description.placeholder")}
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
