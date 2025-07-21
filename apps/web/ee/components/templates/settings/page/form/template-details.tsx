import { observer } from "mobx-react";
import { Controller, FieldPath, FieldValues, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Input, TextArea } from "@plane/ui";
// helpers
import { getNestedError } from "@/helpers/react-hook-form.helper";
// plane web imports
import { validateWhitespaceI18n } from "@/plane-web/components/templates/settings/common";

type TTemplateDetailsProps<T extends FieldValues> = {
  fieldPaths: {
    name: FieldPath<T>;
    shortDescription: FieldPath<T>;
  };
  validation?: {
    name?: {
      required?: string;
      maxLength?: string;
    };
  };
  placeholders?: {
    name?: string;
    shortDescription?: string;
  };
};

export const TemplateDetails = observer(<T extends FieldValues>(props: TTemplateDetailsProps<T>) => {
  const { fieldPaths, validation, placeholders } = props;
  // plane hooks
  const { t } = useTranslation();
  // form context
  const {
    control,
    formState: { errors },
  } = useFormContext<T>();
  // derived values
  const nameError = getNestedError(errors, fieldPaths.name);

  return (
    <>
      {/* Template Name */}
      <div>
        <Controller
          control={control}
          name={fieldPaths.name}
          rules={{
            validate: (value) => {
              const result = validateWhitespaceI18n(value);
              if (result) {
                return t(result);
              }
              return undefined;
            },
            required: validation?.name?.required,
            maxLength: validation?.name?.maxLength
              ? {
                  value: 255,
                  message: validation?.name?.maxLength,
                }
              : undefined,
          }}
          render={({ field: { value, onChange, ref } }) => (
            <Input
              id={fieldPaths.name}
              name={fieldPaths.name}
              type="text"
              value={value}
              onChange={onChange}
              ref={ref}
              placeholder={placeholders?.name}
              className="w-full text-lg font-bold p-0"
              mode="true-transparent"
              inputSize="md"
              hasError={Boolean(nameError)}
              autoFocus
            />
          )}
        />
        {nameError && typeof nameError.message === "string" && (
          <span className="text-xs font-medium text-red-500">{nameError.message}</span>
        )}
      </div>
      {/* Template Description */}
      <div className="space-y-1">
        <Controller
          name={fieldPaths.shortDescription}
          control={control}
          render={({ field: { value, onChange, ref } }) => (
            <TextArea
              id={fieldPaths.shortDescription}
              name={fieldPaths.shortDescription}
              value={value}
              onChange={onChange}
              ref={ref}
              placeholder={placeholders?.shortDescription}
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
