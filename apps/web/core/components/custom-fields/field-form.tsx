/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { CUSTOM_FIELD_TYPES, CUSTOM_FIELD_TYPE_CONFIG_MAP, CUSTOM_FIELD_DEFAULT_WIDTH } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { ECustomFieldType } from "@plane/types";
import type { TCustomField } from "@plane/types";
import { Input, TextArea, ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// local imports
import { CustomFieldInput } from "./custom-field-input";
import { DateSettingInput } from "./date-setting-input";
import { FieldTypeIcon } from "./field-type-icon";
import { OptionsEditor } from "./options-editor";

type Props = {
  data?: TCustomField | null;
  isSubmitting: boolean;
  onSubmit: (payload: Partial<TCustomField>) => Promise<void>;
  handleClose: () => void;
};

type TFieldFormValues = Partial<TCustomField>;

const getDefaultValues = (data?: TCustomField | null): TFieldFormValues => ({
  display_name: data?.display_name ?? "",
  description: data?.description ?? "",
  field_type: data?.field_type ?? ECustomFieldType.TEXT,
  settings: data?.settings ?? {},
  default_value: data?.default_value ?? null,
  is_required: data?.is_required ?? false,
  admin_only: data?.admin_only ?? false,
  is_active: data?.is_active ?? true,
  width: data?.width ?? CUSTOM_FIELD_DEFAULT_WIDTH,
});

export function FieldForm(props: Props) {
  const { data, isSubmitting, onSubmit, handleClose } = props;
  const { t } = useTranslation();
  const isEditing = Boolean(data);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TFieldFormValues>({ defaultValues: getDefaultValues(data) });

  const [optionsError, setOptionsError] = useState(false);

  const fieldType = watch("field_type") as ECustomFieldType;
  const settings = watch("settings") ?? {};
  const config = CUSTOM_FIELD_TYPE_CONFIG_MAP[fieldType];
  const supports = config?.supports;
  const isDateField = fieldType === ECustomFieldType.DATE || fieldType === ECustomFieldType.DATETIME;
  const dateVariant = fieldType === ECustomFieldType.DATETIME ? "datetime" : "date";

  const updateSetting = (key: string, value: unknown) =>
    setValue("settings", { ...watch("settings"), [key]: value }, { shouldDirty: true });

  const handleTypeChange = (type: ECustomFieldType) => {
    setValue("field_type", type, { shouldDirty: true });
    // reset value/settings that no longer apply
    setValue("default_value", null);
  };

  const handleFormSubmit = async (formData: TFieldFormValues) => {
    // selectable field types must have at least one labelled option
    if (supports?.options) {
      const validOptions = (formData.settings?.options ?? []).filter((o) => (o.label ?? "").trim() !== "");
      if (validOptions.length === 0) {
        setOptionsError(true);
        return;
      }
    }
    const payload: Partial<TCustomField> = {
      ...formData,
      width: Math.max(1, Math.min(12, Number(formData.width) || CUSTOM_FIELD_DEFAULT_WIDTH)),
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex max-h-[80vh] flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <h3 className="text-18 font-medium text-primary">
          {isEditing
            ? t("workspace_settings.settings.custom_fields.form.edit_title")
            : t("workspace_settings.settings.custom_fields.form.create_title")}
        </h3>

        {/* Field type picker */}
        <div className="space-y-1.5">
          <label className="text-body-sm-medium text-secondary">
            {t("workspace_settings.settings.custom_fields.form.field_type")}
          </label>
          <Controller
            control={control}
            name="field_type"
            render={({ field: { value } }) => (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {CUSTOM_FIELD_TYPES.map((typeConfig) => {
                  const isSelected = value === typeConfig.type;
                  return (
                    <button
                      key={typeConfig.type}
                      type="button"
                      disabled={isEditing}
                      onClick={() => handleTypeChange(typeConfig.type)}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-body-sm-medium transition-colors",
                        isSelected
                          ? "border-accent-strong bg-accent-subtle text-primary"
                          : "border-subtle text-secondary hover:bg-layer-1",
                        { "cursor-not-allowed opacity-60": isEditing && !isSelected }
                      )}
                    >
                      <FieldTypeIcon type={typeConfig.type} className="size-4 shrink-0 text-tertiary" />
                      <span className="truncate">{t(typeConfig.i18n_label)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {isEditing && (
            <p className="text-11 text-placeholder">
              {t("workspace_settings.settings.custom_fields.form.type_locked")}
            </p>
          )}
        </div>

        {/* Display name */}
        <div className="space-y-1">
          <label className="text-body-sm-medium text-secondary">
            {t("workspace_settings.settings.custom_fields.form.name")}
          </label>
          <Controller
            control={control}
            name="display_name"
            rules={{
              required: t("workspace_settings.settings.custom_fields.form.name_required"),
              validate: (val) =>
                (val ?? "").trim() !== "" || t("workspace_settings.settings.custom_fields.form.name_required"),
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                type="text"
                value={value ?? ""}
                onChange={onChange}
                hasError={Boolean(errors.display_name)}
                placeholder={t("workspace_settings.settings.custom_fields.form.name_placeholder")}
                className="w-full text-body-sm-regular"
              />
            )}
          />
          {errors.display_name && (
            <span className="text-11 text-danger-primary">{errors.display_name.message as string}</span>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-body-sm-medium text-secondary">
            {t("workspace_settings.settings.custom_fields.form.description")}
          </label>
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <TextArea
                value={value ?? ""}
                onChange={onChange}
                placeholder={t("workspace_settings.settings.custom_fields.form.description_placeholder")}
                className="min-h-16 w-full resize-none text-body-sm-regular"
              />
            )}
          />
        </div>

        {/* Type-specific settings */}
        {supports?.options && (
          <OptionsEditor
            options={settings.options ?? []}
            onChange={(options) => {
              updateSetting("options", options);
              if (optionsError) setOptionsError(false);
            }}
            hasError={optionsError}
          />
        )}

        {supports?.placeholder && (
          <div className="space-y-1">
            <label className="text-body-sm-medium text-secondary">
              {t("workspace_settings.settings.custom_fields.form.placeholder")}
            </label>
            <Input
              type="text"
              value={settings.placeholder ?? ""}
              onChange={(e) => updateSetting("placeholder", e.target.value)}
              className="w-full text-body-sm-regular"
            />
          </div>
        )}

        {supports?.length && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-body-sm-medium text-secondary">
                {t("workspace_settings.settings.custom_fields.form.min_length")}
              </label>
              <Input
                type="number"
                min={0}
                value={settings.min_length ?? ""}
                onChange={(e) =>
                  updateSetting("min_length", e.target.value === "" ? undefined : Number(e.target.value))
                }
                className="w-full text-body-sm-regular"
              />
            </div>
            <div className="space-y-1">
              <label className="text-body-sm-medium text-secondary">
                {t("workspace_settings.settings.custom_fields.form.max_length")}
              </label>
              <Input
                type="number"
                min={0}
                value={settings.max_length ?? ""}
                onChange={(e) =>
                  updateSetting("max_length", e.target.value === "" ? undefined : Number(e.target.value))
                }
                className="w-full text-body-sm-regular"
              />
            </div>
          </div>
        )}

        {supports?.numericRange && (
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-body-sm-medium text-secondary">
                {t("workspace_settings.settings.custom_fields.form.min")}
              </label>
              <Input
                type="number"
                value={settings.min ?? ""}
                onChange={(e) => updateSetting("min", e.target.value === "" ? undefined : Number(e.target.value))}
                className="w-full text-body-sm-regular"
              />
            </div>
            <div className="space-y-1">
              <label className="text-body-sm-medium text-secondary">
                {t("workspace_settings.settings.custom_fields.form.max")}
              </label>
              <Input
                type="number"
                value={settings.max ?? ""}
                onChange={(e) => updateSetting("max", e.target.value === "" ? undefined : Number(e.target.value))}
                className="w-full text-body-sm-regular"
              />
            </div>
            <div className="space-y-1">
              <label className="text-body-sm-medium text-secondary">
                {t("workspace_settings.settings.custom_fields.form.step")}
              </label>
              <Input
                type="number"
                value={settings.step ?? ""}
                onChange={(e) => updateSetting("step", e.target.value === "" ? undefined : Number(e.target.value))}
                className="w-full text-body-sm-regular"
              />
            </div>
          </div>
        )}

        {supports?.dateRange && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-body-sm-medium text-secondary">
                {t("workspace_settings.settings.custom_fields.form.min_date")}
              </label>
              <DateSettingInput
                value={settings.min as string | undefined}
                onChange={(next) => updateSetting("min", next)}
                variant={dateVariant}
              />
            </div>
            <div className="space-y-1">
              <label className="text-body-sm-medium text-secondary">
                {t("workspace_settings.settings.custom_fields.form.max_date")}
              </label>
              <DateSettingInput
                value={settings.max as string | undefined}
                onChange={(next) => updateSetting("max", next)}
                variant={dateVariant}
              />
            </div>
          </div>
        )}

        {fieldType === ECustomFieldType.BOOLEAN && (
          <div className="space-y-1">
            <label className="text-body-sm-medium text-secondary">
              {t("workspace_settings.settings.custom_fields.form.checkbox_label")}
            </label>
            <Input
              type="text"
              value={settings.label ?? ""}
              onChange={(e) => updateSetting("label", e.target.value)}
              className="w-full text-body-sm-regular"
            />
          </div>
        )}

        {/* Default value */}
        <div className="space-y-1">
          <label className="text-body-sm-medium text-secondary">
            {t("workspace_settings.settings.custom_fields.form.default_value")}
          </label>
          <Controller
            control={control}
            name="default_value"
            render={({ field: { value, onChange } }) =>
              // date defaults get the same fixed/relative choice as the bounds, so a field can
              // default to e.g. "today + 7 days" instead of a date that goes stale
              isDateField ? (
                <DateSettingInput
                  value={value as string | undefined}
                  onChange={(next) => onChange(next ?? null)}
                  variant={dateVariant}
                />
              ) : (
                <CustomFieldInput
                  field={{ field_type: fieldType, settings }}
                  value={value ?? null}
                  onChange={onChange}
                />
              )
            }
          />
        </div>

        {/* Width */}
        <div className="space-y-1">
          <label className="text-body-sm-medium text-secondary">
            {t("workspace_settings.settings.custom_fields.form.width")}
          </label>
          <Controller
            control={control}
            name="width"
            render={({ field: { value, onChange } }) => (
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={value ?? CUSTOM_FIELD_DEFAULT_WIDTH}
                  onChange={(e) => onChange(Math.max(1, Math.min(12, Number(e.target.value) || 12)))}
                  className="w-20 text-body-sm-regular"
                />
                <span className="text-11 text-placeholder">
                  {t("workspace_settings.settings.custom_fields.form.width_hint")}
                </span>
              </div>
            )}
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3 rounded-md border border-subtle p-3">
          <ToggleRow
            label={t("workspace_settings.settings.custom_fields.form.required")}
            description={t("workspace_settings.settings.custom_fields.form.required_help")}
            control={control}
            name="is_required"
          />
          <ToggleRow
            label={t("workspace_settings.settings.custom_fields.form.admin_only")}
            description={t("workspace_settings.settings.custom_fields.form.admin_only_help")}
            control={control}
            name="admin_only"
          />
          <ToggleRow
            label={t("workspace_settings.settings.custom_fields.form.active")}
            description={t("workspace_settings.settings.custom_fields.form.active_help")}
            control={control}
            name="is_active"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-subtle px-5 py-4">
        <Button variant="secondary" onClick={handleClose}>
          {t("cancel")}
        </Button>
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {isEditing
            ? t("workspace_settings.settings.custom_fields.form.save")
            : t("workspace_settings.settings.custom_fields.form.create")}
        </Button>
      </div>
    </form>
  );
}

type ToggleRowProps = {
  label: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: "is_required" | "admin_only" | "is_active";
};

function ToggleRow({ label, description, control, name }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-body-sm-medium text-primary">{label}</p>
        <p className="text-11 text-tertiary">{description}</p>
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <ToggleSwitch value={Boolean(value)} onChange={onChange} size="sm" />
        )}
      />
    </div>
  );
}
