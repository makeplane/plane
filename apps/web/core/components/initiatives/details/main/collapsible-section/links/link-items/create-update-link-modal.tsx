/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
// plane types
import { Button } from "@plane/propel/button";
import type { TIssueLinkEditableFields } from "@plane/types";
// plane ui
import { Input, ModalCore } from "@plane/ui";
// types
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TLinkOperations } from "./root";
// Plane-web

export type TIssueLinkCreateFormFieldOptions = TIssueLinkEditableFields & {
  id?: string;
};

export type TIssueLinkCreateEditModal = {
  isModalOpen: boolean;
  linkOperations: TLinkOperations;
  handleOnClose?: () => void;
};

const defaultValues: TIssueLinkCreateFormFieldOptions = {
  title: "",
  url: "",
};

export const IssueLinkCreateUpdateModal = observer(function IssueLinkCreateUpdateModal(
  props: TIssueLinkCreateEditModal
) {
  // props
  const { isModalOpen, linkOperations, handleOnClose } = props;
  // react hook form
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<TIssueLinkCreateFormFieldOptions>({
    defaultValues,
  });
  // store hooks
  const {
    initiative: {
      initiativeLinks: { linkData: preloadedData, setLinkData },
    },
  } = useInitiatives();

  const { t } = useTranslation();

  const onClose = () => {
    setLinkData(null);
    if (handleOnClose) handleOnClose();
  };

  const handleFormSubmit = async (formData: TIssueLinkCreateFormFieldOptions) => {
    const parsedUrl = formData.url.startsWith("http") ? formData.url : `http://${formData.url}`;
    try {
      if (!formData || !formData.id)
        await linkOperations.create({
          title: formData.title,
          url: parsedUrl,
        });
      else
        await linkOperations.update(formData.id, {
          title: formData.title,
          url: parsedUrl,
        });
      onClose();
    } catch (error) {
      console.error("error", error);
    }
  };

  useEffect(() => {
    if (isModalOpen)
      reset({ id: preloadedData?.id ?? undefined, url: preloadedData?.url ?? "", title: preloadedData?.title ?? "" });
  }, [preloadedData, reset, isModalOpen]);

  return (
    <ModalCore isOpen={isModalOpen} handleClose={onClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-18 font-medium text-secondary">
            {preloadedData?.id ? t("common.update_link") : t("common.add_link")}
          </h3>
          <div className="mt-2 space-y-3">
            <div>
              <label htmlFor="url" className="mb-2 text-secondary">
                {t("link.modal.url.text")}
              </label>
              <Controller
                control={control}
                name="url"
                rules={{
                  required: t("link.modal.url.required"),
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="url"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.url)}
                    placeholder={t("link.modal.url.placeholder")}
                    className="w-full"
                  />
                )}
              />
              {errors.url && <span className="text-11 text-danger-primary">{t("link.modal.url.required")}</span>}
            </div>
            <div>
              <label htmlFor="title" className="mb-2 text-secondary">
                {t("link.modal.title.text")}
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
                    placeholder={t("link.modal.title.placeholder")}
                    className="w-full"
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
          <Button variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {preloadedData?.id
              ? isSubmitting
                ? t("updating")
                : t("update")
              : isSubmitting
                ? t("common.adding")
                : t("add")}{" "}
            {t("common.link").toLowerCase()}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
