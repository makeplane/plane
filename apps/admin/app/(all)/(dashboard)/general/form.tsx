/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Telescope } from "lucide-react";
// gizmo imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IInstance, IInstanceAdmin } from "@plane/types";
import { Input, ToggleSwitch } from "@plane/ui";
// components
import { ControllerInput } from "@/components/common/controller-input";
// hooks
import { useInstance } from "@/hooks/store";
// components
import { IntercomConfig } from "./intercom";
import { InstanceAdmins } from "./instance-admins";

export interface IGeneralConfigurationForm {
  instance: IInstance;
  instanceAdmins: IInstanceAdmin[];
}

export const GeneralConfigurationForm = observer(function GeneralConfigurationForm(props: IGeneralConfigurationForm) {
  const { instance, instanceAdmins } = props;
  // hooks
  const { instanceConfigurations, updateInstanceInfo, updateInstanceConfigurations } = useInstance();

  // form data
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<Partial<IInstance>>({
    defaultValues: {
      instance_name: instance?.instance_name,
      is_telemetry_enabled: instance?.is_telemetry_enabled,
    },
  });

  const onSubmit = async (formData: Partial<IInstance>) => {
    const payload: Partial<IInstance> = { ...formData };

    // update the intercom configuration
    const isIntercomEnabled =
      instanceConfigurations?.find((config) => config.key === "IS_INTERCOM_ENABLED")?.value === "1";
    if (!payload.is_telemetry_enabled && isIntercomEnabled) {
      try {
        await updateInstanceConfigurations({ IS_INTERCOM_ENABLED: "0" });
      } catch (error) {
        console.error(error);
      }
    }

    await updateInstanceInfo(payload)
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Готово",
          message: "Настройки успешно обновлены",
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="text-16 font-medium text-primary">Сведения об экземпляре</div>
        <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-8 md:grid-cols-2 lg:grid-cols-3">
          <ControllerInput
            key="instance_name"
            name="instance_name"
            control={control}
            type="text"
            label="Название экземпляра"
            placeholder="Название экземпляра"
            error={Boolean(errors.instance_name)}
            required
          />

          <div className="flex flex-col gap-1">
            <h4 className="text-13 text-tertiary">Эл. почта</h4>
            <Input
              id="email"
              name="email"
              type="email"
              value={instanceAdmins.find((admin) => admin.role === 20)?.user_detail?.email ?? ""}
              placeholder="Эл. почта администратора"
              className="w-full cursor-not-allowed !text-placeholder"
              autoComplete="on"
              disabled
            />
          </div>

          <div className="flex flex-col gap-1">
            <h4 className="text-13 text-tertiary">ID экземпляра</h4>
            <Input
              id="instance_id"
              name="instance_id"
              type="text"
              value={instance.instance_id}
              className="w-full cursor-not-allowed rounded-md font-medium !text-placeholder"
              disabled
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border-b border-subtle pb-1.5 text-16 font-medium text-primary">Чат + телеметрия</div>
        <IntercomConfig isTelemetryEnabled={watch("is_telemetry_enabled") ?? false} />
        <div className="flex items-center gap-14">
          <div className="flex grow items-center gap-4">
            <div className="shrink-0">
              <div className="flex size-11 items-center justify-center rounded-lg bg-layer-1">
                <Telescope className="size-5 text-tertiary" />
              </div>
            </div>
            <div className="grow">
              <div className="text-13 leading-5 font-medium text-primary">
                Разрешить Gizmo собирать анонимные данные об использовании
              </div>
              <div className="text-11 leading-5 font-regular text-tertiary">
                Персональные данные не собираются. Эти обезличенные данные используются для понимания того, как вы
                используете Gizmo, и для создания новых функций в соответствии с{" "}
                <a
                  href="https://developers.gizmo.so/self-hosting/telemetry"
                  target="_blank"
                  className="text-accent-primary hover:underline"
                  rel="noreferrer"
                >
                  нашей Политикой телеметрии.
                </a>
              </div>
            </div>
          </div>
          <div className={`shrink-0 ${isSubmitting && "opacity-70"}`}>
            <Controller
              control={control}
              name="is_telemetry_enabled"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch value={value ?? false} onChange={onChange} size="sm" disabled={isSubmitting} />
              )}
            />
          </div>
        </div>
      </div>

      <InstanceAdmins instanceAdmins={instanceAdmins} />

      <div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            void handleSubmit(onSubmit)();
          }}
          loading={isSubmitting}
        >
          {isSubmitting ? "Сохранение" : "Сохранить изменения"}
        </Button>
      </div>
    </div>
  );
});
