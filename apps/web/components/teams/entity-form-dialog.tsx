/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { InputField } from "@makeplane/propel/components/input-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
// plane imports
import { useTranslation } from "@plane/i18n";

export type TEntityFormValues = { name: string; description: string };

type Props = {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  defaultValues?: Partial<TEntityFormValues>;
  /** Extra fields, e.g. the kind and admins of a team. */
  children?: ReactNode;
  onClose: () => void;
  /** Resolves to whether the dialog may close. */
  onSubmit: (values: TEntityFormValues) => Promise<boolean>;
};

const EMPTY_VALUES: TEntityFormValues = { name: "", description: "" };

/** Name and description form shared by teams and portfolios. */
export function EntityFormDialog(props: Props) {
  const { isOpen, title, submitLabel, defaultValues, children, onClose, onSubmit } = props;
  const { name = "", description = "" } = defaultValues ?? {};
  const { t } = useTranslation();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<TEntityFormValues>({ defaultValues: EMPTY_VALUES });

  useEffect(() => {
    if (isOpen) reset({ name, description });
  }, [isOpen, name, description, reset]);

  const submit = async (values: TEntityFormValues) => {
    if (await onSubmit({ ...values, name: values.name.trim() })) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <form onSubmit={handleSubmit(submit)} className="flex min-h-0 flex-1 flex-col">
          <DialogMain>
            <DialogHeader>
              <DialogHeading>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeading>
            </DialogHeader>
            <DialogBody tabIndex={0}>
              <div className="space-y-5">
                <Controller
                  control={control}
                  name="name"
                  rules={{
                    validate: (value) => !!value.trim() || t("form.title.required"),
                    maxLength: { value: 255, message: t("form.title.max_length", { length: 255 }) },
                  }}
                  render={({ field }) => (
                    <InputField
                      size="lg"
                      orientation="vertical"
                      label={t("name")}
                      required
                      error={errors.name?.message}
                      type="text"
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      ref={field.ref}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <TextAreaField
                      size="lg"
                      autoResize
                      maxRows={8}
                      label={t("description")}
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {children}
              </div>
            </DialogBody>
          </DialogMain>
          <DialogActions>
            <Button variant="secondary" size="md" stretch="auto" onClick={onClose} label={t("cancel")} />
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              type="submit"
              loading={isSubmitting}
              label={submitLabel}
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
