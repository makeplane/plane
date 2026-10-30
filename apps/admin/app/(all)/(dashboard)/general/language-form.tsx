/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@makeplane/propel/components/button";
import { Select } from "@plane/blocks/select";
import { setToast } from "@plane/blocks/toast";
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from "@plane/i18n";
import type { ILanguageOption } from "@plane/i18n";
import type { IFormattedInstanceConfiguration } from "@plane/types";
import { useInstance } from "@/hooks/store";

type LanguageFormValues = Pick<IFormattedInstanceConfiguration, "DEFAULT_LANGUAGE">;

export function DefaultLanguageForm({
  config,
  readOnly = false,
}: {
  config: IFormattedInstanceConfiguration;
  readOnly?: boolean;
}) {
  const { updateInstanceConfigurations } = useInstance();
  const defaultLanguage = config.DEFAULT_LANGUAGE || FALLBACK_LANGUAGE;
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<LanguageFormValues>({
    defaultValues: { DEFAULT_LANGUAGE: defaultLanguage },
  });

  useEffect(() => {
    // Refresh idle forms without replacing an administrator's unsaved choice.
    // Once managed by the environment, always display the effective read-only value.
    if (!isDirty || readOnly) reset({ DEFAULT_LANGUAGE: defaultLanguage });
  }, [defaultLanguage, isDirty, readOnly, reset]);

  const onSubmit = async (values: LanguageFormValues) => {
    try {
      await updateInstanceConfigurations(values);
      reset(values);
      setToast({ type: "success", title: "Success", message: "Default language updated successfully" });
    } catch (error) {
      const message =
        typeof error === "object" && error !== null && "error" in error && typeof error.error === "string"
          ? error.error
          : "Failed to update default language";
      setToast({ type: "error", title: "Error", message });
    }
  };

  return (
    <div className="space-y-4 border-t border-subtle pt-6">
      <div className="space-y-1">
        <label htmlFor="default-language" className="text-16 font-medium text-primary">
          Default language
        </label>
        <p className="text-13 text-secondary">
          New users start in this language and can change it in their preferences. Existing users keep their language.
        </p>
        {readOnly && <p className="text-13 text-secondary">Managed by the DEFAULT_LANGUAGE environment variable.</p>}
      </div>
      <Controller
        control={control}
        name="DEFAULT_LANGUAGE"
        render={({ field: { value, onChange } }) => (
          <Select<ILanguageOption>
            getValues={() => SUPPORTED_LANGUAGES}
            value={SUPPORTED_LANGUAGES.find((language) => language.value === value) ?? null}
            onChange={onChange}
            getOptionValue={(language) => language.value}
            getOptionLabel={(language) => language.label}
            disabled={isSubmitting || readOnly}
            showSearch={false}
            pinSelected={false}
            contentSizing="anchor"
          >
            <Select.Trigger<ILanguageOption> id="default-language" variant="select-md" className="w-52 max-w-full">
              <span className="min-w-0 grow truncate text-left">
                {SUPPORTED_LANGUAGES.find((language) => language.value === value)?.label ?? "Select a language"}
              </span>
            </Select.Trigger>
          </Select>
        )}
      />
      <Button
        variant="primary"
        size="md"
        stretch="auto"
        onClick={() => void handleSubmit(onSubmit)()}
        loading={isSubmitting}
        disabled={!isDirty || isSubmitting || readOnly}
        label={isSubmitting ? "Saving" : "Save language"}
      />
    </div>
  );
}
