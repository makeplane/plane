/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ChangeEvent } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { InputField } from "@makeplane/propel/components/input-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { InfoOutline } from "@makeplane/propel/icons";
// plane imports
import { ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TProject } from "@plane/types";
// ui
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { projectIdentifierSanitizer, getTabIndex } from "@plane/utils";

type Props = {
  setValue: UseFormSetValue<TProject>;
  isMobile: boolean;
  shouldAutoSyncIdentifier: boolean;
  setShouldAutoSyncIdentifier: (value: boolean) => void;
  handleFormOnChange?: () => void;
};

function ProjectCommonAttributes(props: Props) {
  const { setValue, isMobile, shouldAutoSyncIdentifier, setShouldAutoSyncIdentifier, handleFormOnChange } = props;
  const {
    formState: { errors },
    control,
  } = useFormContext<TProject>();

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);
  const { t } = useTranslation();

  const handleNameChange =
    (onChange: (event: ChangeEvent<HTMLInputElement>) => void) => (e: ChangeEvent<HTMLInputElement>) => {
      if (!shouldAutoSyncIdentifier) {
        onChange(e);
        return;
      }
      if (e.target.value === "") setValue("identifier", "");
      else setValue("identifier", projectIdentifierSanitizer(e.target.value).substring(0, 10));
      onChange(e);
      handleFormOnChange?.();
    };

  const handleIdentifierChange = (onChange: (value: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const alphanumericValue = projectIdentifierSanitizer(value);
    setShouldAutoSyncIdentifier(false);
    onChange(alphanumericValue);
    handleFormOnChange?.();
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
            <InputField
              size="lg"
              orientation="vertical"
              error={errors?.name?.message}
              id="name"
              name="name"
              type="text"
              value={value}
              onChange={handleNameChange(onChange)}
              placeholder={t("project_name")}
              aria-label={t("project_name")}
              tabIndex={getIndex("name")}
            />
          )}
        />
      </div>
      <div>
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
              message: t("project_id_min_char"),
            },
            maxLength: {
              value: 10,
              message: t("project_id_max_char"),
            },
          }}
          render={({ field: { value, onChange } }) => (
            <InputField
              size="lg"
              orientation="vertical"
              error={errors?.identifier?.message}
              id="identifier"
              name="identifier"
              type="text"
              value={value}
              onChange={handleIdentifierChange(onChange)}
              placeholder={t("project_id")}
              aria-label={t("project_id")}
              tabIndex={getIndex("identifier")}
              endIcon={
                <Tooltip
                  label={t("project_id_tooltip_content")}
                  layout="stacked"
                  side="right"
                  align="start"
                  disabled={isMobile}
                >
                  <IconButton
                    variant="ghost"
                    size="xs"
                    icon={<Icon icon={InfoOutline} size="sm" tint="placeholder" />}
                    aria-label={t("project_id_tooltip_content")}
                    showTooltip={false}
                  />
                </Tooltip>
              }
            />
          )}
        />
      </div>
      <div className="md:col-span-4">
        <Controller
          name="description"
          control={control}
          render={({ field: { value, onChange } }) => (
            <TextAreaField
              size="lg"
              autoResize
              maxRows={8}
              error={errors?.description?.message}
              id="description"
              name="description"
              value={value}
              placeholder={t("description")}
              aria-label={t("description")}
              onChange={(e) => {
                onChange(e);
                handleFormOnChange?.();
              }}
              tabIndex={getIndex("description")}
            />
          )}
        />
      </div>
    </div>
  );
}

export default ProjectCommonAttributes;
