/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Controller, useForm } from "react-hook-form";
// plane imports
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// ui
import { TextArea } from "@plane/ui";

export type TAIAccountFormValues = {
  name: string;
  description: string;
};

type Props = {
  defaultValues: TAIAccountFormValues;
  handleClose: () => void;
  isSubmitting: boolean;
  loadingLabel: string;
  submitLabel: string;
  title: string;
  onSubmit: (data: TAIAccountFormValues) => Promise<void>;
};

export function AIAccountForm(props: Props) {
  const { defaultValues, handleClose, isSubmitting, loadingLabel, submitLabel, title, onSubmit } = props;
  // form
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<TAIAccountFormValues>({ defaultValues });
  // hooks
  const { t } = useTranslation();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-5 p-5">
        <h3 className="text-18 font-medium text-secondary">{title}</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <Controller
              control={control}
              name="name"
              rules={{
                required: t("workspace_settings.settings.ai_accounts.modal.name_required"),
                validate: (val) =>
                  val.trim() !== "" || t("workspace_settings.settings.ai_accounts.modal.name_required"),
              }}
              render={({ field: { value, onChange } }) => (
                <Field name="input" invalid={Boolean(errors.name)}>
                  <InputGroup size="2xl">
                    <Input
                      size="2xl"
                      type="text"
                      value={value}
                      onChange={onChange}
                      placeholder={t("workspace_settings.settings.ai_accounts.modal.name")}
                      aria-label={t("workspace_settings.settings.ai_accounts.modal.name")}
                    />
                  </InputGroup>
                </Field>
              )}
            />
            {errors.name && <span className="text-11 text-danger-primary">{errors.name.message}</span>}
          </div>
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <TextArea
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.description)}
                placeholder={t("workspace_settings.settings.ai_accounts.modal.description")}
                className="min-h-24 w-full resize-none text-14"
              />
            )}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-subtle px-5 py-4">
        <Button variant="secondary" onClick={handleClose}>
          {t("cancel")}
        </Button>
        <Button variant="primary" type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? loadingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
