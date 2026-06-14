/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// gizmo types
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ILinkDetails, ModuleLink } from "@plane/types";
// gizmo ui
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
          title: "Готово!",
          message: "Ссылка модуля успешно создана.",
        });
      } else {
        await updateLink(payload, data.id);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Готово!",
          message: "Ссылка модуля успешно обновлена.",
        });
      }
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Ошибка!",
        message: error?.data?.error ?? "Произошла ошибка. Пожалуйста, попробуйте снова.",
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
          <h3 className="text-18 font-medium text-secondary">{data ? "Обновить" : "Добавить"} ссылку</h3>
          <div className="mt-2 space-y-3">
            <div>
              <label htmlFor="url" className="mb-2 text-secondary">
                URL
              </label>
              <Controller
                control={control}
                name="url"
                rules={{
                  required: "URL обязателен",
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="url"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.url)}
                    placeholder="Введите или вставьте URL"
                    className="w-full"
                  />
                )}
              />
            </div>
            <div>
              <label htmlFor="title" className="mb-2 text-secondary">
                Отображаемое название
                <span className="block text-10">Необязательно</span>
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
                    placeholder="Как вы хотите видеть эту ссылку"
                    className="w-full"
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-subtle px-5 py-4">
          <Button variant="secondary" size="lg" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
            {data
              ? isSubmitting
                ? "Обновление ссылки"
                : "Обновить ссылку"
              : isSubmitting
                ? "Добавление ссылки"
                : "Добавить ссылку"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
