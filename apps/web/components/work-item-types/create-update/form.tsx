/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { InputField } from "@makeplane/propel/components/input-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// local imports
import { ISSUE_TYPE_LOGO_COLORS, ISSUE_TYPE_LOGO_ICONS, IssueTypeLogo } from "../common/issue-type-logo";

export type TIssueTypeFormValues = {
  name: string;
  description: string;
  logo_props: {
    in_use: "icon";
    icon: {
      name: string;
      background_color: string;
    };
  };
};

type Props = {
  formData: TIssueTypeFormValues;
  isSubmitting: boolean;
  isEdit: boolean;
  onChange: (values: TIssueTypeFormValues) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export const CreateOrUpdateIssueTypeForm = observer(function CreateOrUpdateIssueTypeForm(props: Props) {
  const { formData, isSubmitting, isEdit, onChange, onClose, onSubmit } = props;
  // translation
  const { t } = useTranslation();
  // states
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  const handleNameChange = (value: string) => {
    onChange({ ...formData, name: value });
    if (nameError && value.trim()) setNameError(undefined);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      setNameError(t("common.errors.entity_required", { entity: t("common.name") }));
      return;
    }
    setNameError(undefined);
    await onSubmit();
  };

  return (
    <form onSubmit={(event) => void handleFormSubmit(event)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-4 p-5 pb-4">
        <div className="flex items-center gap-3">
          <IssueTypeLogo icon_props={formData.logo_props.icon} size="xl" />
          <InputField
            id="name"
            name="name"
            size="xl"
            orientation="vertical"
            label={t("common.name")}
            required
            value={formData.name}
            onChange={(event) => handleNameChange(event.target.value)}
            error={nameError}
            placeholder={t("work_item_types.create_update.form.name.placeholder")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-11 font-medium text-tertiary">Icon</span>
          <div className="flex items-center gap-2">
            {ISSUE_TYPE_LOGO_ICONS.map(({ name, Icon }) => (
              <button
                key={name}
                type="button"
                aria-label={name}
                className={cn(
                  "grid size-8 place-items-center rounded border transition-colors",
                  formData.logo_props.icon.name === name ? "border-accent-strong" : "border-subtle hover:bg-layer-1"
                )}
                onClick={() =>
                  onChange({
                    ...formData,
                    logo_props: {
                      ...formData.logo_props,
                      icon: { ...formData.logo_props.icon, name },
                    },
                  })
                }
              >
                <Icon className="size-4 text-secondary" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-11 font-medium text-tertiary">Color</span>
          <div className="flex items-center gap-2">
            {ISSUE_TYPE_LOGO_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color}
                className={cn(
                  "size-6 rounded-full border-2 transition-colors",
                  formData.logo_props.icon.background_color === color ? "border-primary" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
                onClick={() =>
                  onChange({
                    ...formData,
                    logo_props: {
                      ...formData.logo_props,
                      icon: { ...formData.logo_props.icon, background_color: color },
                    },
                  })
                }
              />
            ))}
          </div>
        </div>
        <TextAreaField
          id="description"
          name="description"
          size="xl"
          value={formData.description}
          onChange={(event) => onChange({ ...formData, description: event.target.value })}
          placeholder={t("work_item_types.create_update.form.description.placeholder")}
        />
      </div>
      <div className="mx-5 flex items-center justify-end gap-2 border-t border-subtle py-3">
        <Button variant="secondary" size="sm" stretch="auto" label={t("common.cancel")} onClick={onClose} />
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          type="submit"
          loading={isSubmitting}
          label={isEdit ? t("work_item_types.update.button") : t("work_item_types.create.button")}
        />
      </div>
    </form>
  );
});
