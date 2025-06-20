import { ChangeEvent } from "react";
import { Controller, useFormContext, UseFormSetValue } from "react-hook-form";
import { Info } from "lucide-react";
// plane imports
import { ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { Input, TextArea, Tooltip } from "@plane/ui";
import { cn, projectIdentifierSanitizer, getTabIndex } from "@plane/utils";
// plane utils
// helpers
// plane-web types
import { TProject } from "@/plane-web/types/projects";

type Props = {
  setValue: UseFormSetValue<TProject>;
  isMobile: boolean;
  isChangeInIdentifierRequired: boolean;
  setIsChangeInIdentifierRequired: (value: boolean) => void;
};
const ProjectCommonAttributes: React.FC<Props> = (props) => {
  const { setValue, isMobile, isChangeInIdentifierRequired, setIsChangeInIdentifierRequired } = props;
  const {
    formState: { errors },
    control,
  } = useFormContext<TProject>();

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);
  const { t } = useTranslation();

  const handleNameChange = (onChange: (...event: any[]) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    if (!isChangeInIdentifierRequired) {
      onChange(e);
      return;
    }
    if (e.target.value === "") setValue("identifier", "");
    else setValue("identifier", projectIdentifierSanitizer(e.target.value).substring(0, 5));
    onChange(e);
  };

  const handleIdentifierChange = (onChange: any) => (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const alphanumericValue = projectIdentifierSanitizer(value);
    setIsChangeInIdentifierRequired(false);
    onChange(alphanumericValue);
  };
  return (
    <div className="grid grid-cols-1 gap-x-2 gap-y-3 md:grid-cols-4">
      <div className="md:col-span-3">
        <Controller
          control={control}
          name="name"
          rules={{
            required: t("name_is_required"),
            maxLength: {
              value: 255,
              message: t("title_should_be_less_than_255_characters"),
            },
          }}
          render={({ field: { value, onChange } }) => (
            <Input
              id="name"
              name="name"
              type="text"
              value={value}
              onChange={handleNameChange(onChange)}
              hasError={Boolean(errors.name)}
              placeholder={t("project_name")}
              className="w-full focus:border-blue-400"
              tabIndex={getIndex("name")}
            />
          )}
        />
        <span className="text-xs text-red-500">{errors?.name?.message}</span>
      </div>
      <div className="relative">
        <Controller
          control={control}
          name="identifier"
          rules={{
            required: t("project_id_is_required"),
            // allow only alphanumeric & non-latin characters
            validate: (value) =>
              /^[ÇŞĞIİÖÜA-Z0-9]+$/.test(value.toUpperCase()) || t("only_alphanumeric_non_latin_characters_allowed"),
            minLength: {
              value: 1,
              message: t("project_id_must_be_at_least_1_character"),
            },
            maxLength: {
              value: 5,
              message: t("project_id_must_be_at_most_5_characters"),
            },
          }}
          render={({ field: { value, onChange } }) => (
            <Input
              id="identifier"
              name="identifier"
              type="text"
              value={value}
              onChange={handleIdentifierChange(onChange)}
              hasError={Boolean(errors.identifier)}
              placeholder={t("project_id")}
              className={cn("w-full text-xs focus:border-blue-400 pr-7", {
                uppercase: value,
              })}
              tabIndex={getIndex("identifier")}
            />
          )}
        />
        <Tooltip
          isMobile={isMobile}
          tooltipContent={t("project_id_tooltip_content")}
          className="text-sm"
          position="right-top"
        >
          <Info className="absolute right-2 top-2.5 h-3 w-3 text-custom-text-400" />
        </Tooltip>
        <span className="text-xs text-red-500">{errors?.identifier?.message}</span>
      </div>
      <div className="md:col-span-4">
        <Controller
          name="description"
          control={control}
          render={({ field: { value, onChange } }) => (
            <TextArea
              id="description"
              name="description"
              value={value}
              placeholder={t("description")}
              onChange={onChange}
              className="!h-24 text-sm focus:border-blue-400"
              hasError={Boolean(errors?.description)}
              tabIndex={getIndex("description")}
            />
          )}
        />
      </div>
    </div>
  );
};

export default ProjectCommonAttributes;
