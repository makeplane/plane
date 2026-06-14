/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useForm } from "react-hook-form";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceImageConfigurationKeys } from "@plane/types";
// components
import { ControllerInput } from "@/components/common/controller-input";
// hooks
import { useInstance } from "@/hooks/store";

type IInstanceImageConfigForm = {
  config: IFormattedInstanceConfiguration;
};

type ImageConfigFormValues = Record<TInstanceImageConfigurationKeys, string>;

export function InstanceImageConfigForm(props: IInstanceImageConfigForm) {
  const { config } = props;
  // store hooks
  const { updateInstanceConfigurations } = useInstance();
  // form data
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ImageConfigFormValues>({
    defaultValues: {
      UNSPLASH_ACCESS_KEY: config["UNSPLASH_ACCESS_KEY"],
    },
  });

  const onSubmit = async (formData: ImageConfigFormValues) => {
    const payload: Partial<ImageConfigFormValues> = { ...formData };

    await updateInstanceConfigurations(payload)
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Готово",
          message: "Настройки конфигурации изображений успешно обновлены",
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <div className="space-y-8">
      <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-x-16 gap-y-8 lg:grid-cols-2">
        <ControllerInput
          control={control}
          type="password"
          name="UNSPLASH_ACCESS_KEY"
          label="Ключ доступа от вашей учётной записи Unsplash"
          description={
            <>
              Ключ доступа можно найти в консоли разработчика Unsplash.&nbsp;
              <a
                href="https://unsplash.com/documentation#creating-a-developer-account"
                target="_blank"
                className="text-accent-primary hover:underline"
                rel="noreferrer"
              >
                Подробнее.
              </a>
            </>
          }
          placeholder="oXgq-sdfadsaeweqasdfasdf3234234rassd"
          error={Boolean(errors.UNSPLASH_ACCESS_KEY)}
          required
        />
      </div>

      <div>
        <Button variant="primary" size="lg" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
          {isSubmitting ? "Сохранение" : "Сохранить изменения"}
        </Button>
      </div>
    </div>
  );
}
