/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// plane types
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
import { setToast } from "@plane/blocks/toast";
import type { ILinkDetails, ModuleLink } from "@plane/types";

type Props = {
  createLink: (formData: ModuleLink) => Promise<void>;
  data?: ILinkDetails | null;
  isOpen: boolean;
  handleClose: () => void;
  updateLink: (formData: ModuleLink, linkId: string) => Promise<void>;
};

const defaultValues: ModuleLink = {
  title: "",
  url: "",
};

export function CreateUpdateModuleLinkModal(props: Props) {
  const { t } = useTranslation();

  const { isOpen, handleClose, createLink, updateLink, data } = props;
  // form info
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<ModuleLink>({
    defaultValues,
  });

  const onClose = () => {
    handleClose();
  };

  const handleFormSubmit = async (formData: ModuleLink) => {
    const parsedUrl = formData.url.startsWith("http") ? formData.url : `http://${formData.url}`;
    const payload = {
      title: formData.title,
      url: parsedUrl,
    };

    try {
      if (!data) {
        await createLink(payload);
        setToast({
          type: "success",
          title: t("success"),
          message: t("web_ui.module_link_created_successfully"),
        });
      } else {
        await updateLink(payload, data.id);
        setToast({
          type: "success",
          title: t("success"),
          message: t("web_ui.module_link_updated_successfully"),
        });
      }
      onClose();
    } catch (error: any) {
      setToast({
        type: "error",
        title: t("error"),
        message: error?.data?.error ?? "Some error occurred. Please try again.",
      });
    }
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, isOpen, reset]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="md">
        <form onSubmit={(e) => void handleSubmit(handleFormSubmit)(e)} className="flex min-h-0 flex-1 flex-col">
          <DialogMain>
            <DialogHeader>
              <DialogHeading>
                <DialogTitle>
                  {data ? t("update") : t("add")} {t("common.link")}
                </DialogTitle>
              </DialogHeading>
            </DialogHeader>
            <DialogBody tabIndex={0}>
              <div className="space-y-3">
                <Controller
                  control={control}
                  name="url"
                  rules={{
                    required: t("workspace_settings.settings.webhooks.modal.error"),
                  }}
                  render={({ field: { value, onChange, ref } }) => (
                    <InputField
                      id="url"
                      type="text"
                      size="xl"
                      orientation="vertical"
                      label="URL"
                      value={value}
                      onChange={onChange}
                      ref={ref}
                      error={errors.url?.message}
                      placeholder={t("common.type_or_paste_a_url")}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="title"
                  render={({ field: { value, onChange, ref } }) => (
                    <InputField
                      id="title"
                      type="text"
                      size="xl"
                      orientation="vertical"
                      label={t("common.display_title")}
                      description={t("optional")}
                      value={value}
                      onChange={onChange}
                      ref={ref}
                      error={errors.title?.message}
                      placeholder={t("common.link_title_placeholder")}
                    />
                  )}
                />
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
              label={
                data
                  ? isSubmitting
                    ? t("web_ui.updating_link")
                    : t("common.update_link")
                  : isSubmitting
                    ? t("web_ui.adding_link")
                    : t("add_link")
              }
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
