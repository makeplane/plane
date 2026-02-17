/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ILinkDetails, ModuleLink } from "@plane/types";
// plane ui
import { Input, ModalCore } from "@plane/ui";

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
  const { isOpen, handleClose, createLink, updateLink, data } = props;
  // i18n
  const { t } = useTranslation();
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
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: t("project_modules.links.create.success"),
        });
      } else {
        await updateLink(payload, data.id);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: t("project_modules.links.update.success"),
        });
      }
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: error?.data?.error ?? t("common.errors.default.message"),
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
    <ModalCore isOpen={isOpen} handleClose={onClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-18 font-medium text-secondary">
            {data ? t("project_modules.links.update.title") : t("project_modules.links.create.title")}
          </h3>
          <div className="mt-2 space-y-3">
            <div>
              <label htmlFor="url" className="mb-2 text-secondary">
                {t("common.url")}
              </label>
              <Controller
                control={control}
                name="url"
                rules={{
                  required: t("common.errors.required"),
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="url"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.url)}
                    placeholder={t("common.type_or_paste_a_url")}
                    className="w-full"
                  />
                )}
              />
            </div>
            <div>
              <label htmlFor="title" className="mb-2 text-secondary">
                {t("common.display_title")}
                <span className="text-10 block">{t("common.optional")}</span>
              </label>
              <Controller
                control={control}
                name="title"
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="title"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.title)}
                    placeholder={t("common.link_title_placeholder")}
                    className="w-full"
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
            {data
              ? isSubmitting
                ? t("project_modules.links.update.button_loading")
                : t("project_modules.links.update.button")
              : isSubmitting
                ? t("project_modules.links.create.button_loading")
                : t("project_modules.links.create.button")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
