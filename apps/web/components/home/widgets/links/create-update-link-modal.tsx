/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane types
// plane ui
import { InputField } from "@makeplane/propel/components/input-field";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import type { TLinkEditableFields } from "@plane/types";
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
import type { TLinkOperations } from "./use-links";

export type TLinkOperationsModal = Exclude<TLinkOperations, "remove">;

export type TLinkCreateFormFieldOptions = TLinkEditableFields & {
  id?: string;
};

export type TLinkCreateEditModal = {
  isModalOpen: boolean;
  handleOnClose?: () => void;
  linkOperations: TLinkOperationsModal;
  preloadedData?: TLinkCreateFormFieldOptions;
};

const defaultValues: TLinkCreateFormFieldOptions = {
  title: "",
  url: "",
};

export const LinkCreateUpdateModal = observer(function LinkCreateUpdateModal(props: TLinkCreateEditModal) {
  // props
  const { isModalOpen, handleOnClose, linkOperations, preloadedData } = props;
  // react hook form
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<TLinkCreateFormFieldOptions>({
    defaultValues,
  });
  const { t } = useTranslation();

  const onClose = () => {
    if (handleOnClose) handleOnClose();
  };

  const handleFormSubmit = async (formData: TLinkCreateFormFieldOptions) => {
    const parsedUrl = formData.url.startsWith("http") ? formData.url : `http://${formData.url}`;
    try {
      if (!formData || !formData.id) await linkOperations.create({ title: formData.title, url: parsedUrl });
      else await linkOperations.update(formData.id, { title: formData.title, url: parsedUrl });
      onClose();
    } catch (error) {
      console.error("error", error);
    }
  };

  useEffect(() => {
    if (isModalOpen) reset({ ...defaultValues, ...preloadedData });
    return () => reset(defaultValues);
  }, [preloadedData, reset, isModalOpen]);

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="md">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DialogMain>
            <DialogHeader>
              <DialogHeading>
                <DialogTitle>
                  {preloadedData?.id ? t("update") : t("add")} {t("home.quick_links.title")}
                </DialogTitle>
              </DialogHeading>
            </DialogHeader>
            <DialogBody tabIndex={0}>
              <div className="space-y-5">
                <Controller
                  control={control}
                  name="url"
                  rules={{
                    required: t("link.modal.url.required"),
                  }}
                  render={({ field: { value, onChange, ref } }) => (
                    <InputField
                      size="lg"
                      orientation="vertical"
                      name="url"
                      label={t("link.modal.url.text")}
                      required
                      error={errors.url ? t("link.modal.url.required") : undefined}
                      id="url"
                      type="text"
                      value={value}
                      onChange={onChange}
                      ref={ref}
                      placeholder={t("link.modal.url.placeholder")}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="title"
                  render={({ field: { value, onChange, ref } }) => (
                    <InputField
                      size="lg"
                      orientation="vertical"
                      name="title"
                      label={t("link.modal.title.text")}
                      description={t("optional")}
                      id="title"
                      type="text"
                      value={value}
                      onChange={onChange}
                      ref={ref}
                      placeholder={t("link.modal.title.placeholder")}
                    />
                  )}
                />
              </div>
            </DialogBody>
          </DialogMain>
          <DialogActions>
            <Button variant="secondary" size="md" stretch="auto" onClick={onClose} label={t("Cancel")} />
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              type="submit"
              loading={isSubmitting}
              label={`${
                preloadedData?.id ? (isSubmitting ? t("updating") : t("update")) : isSubmitting ? t("adding") : t("add")
              } ${t("home.quick_links.title")}`}
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
});
