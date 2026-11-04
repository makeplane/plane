/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { UsageOutline } from "@makeplane/propel/icons";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { InputField } from "@makeplane/propel/components/input-field";
import { Switch } from "@makeplane/propel/components/switch";
import type { IInstance, IInstanceAdmin } from "@plane/types";
// components
import { ControllerInput } from "@/components/common/controller-input";
import { setToast } from "@plane/blocks/toast";
// hooks
import { useInstance } from "@/hooks/store";

export interface IGeneralConfigurationForm {
  instance: IInstance;
  instanceAdmins: IInstanceAdmin[];
}

export const GeneralConfigurationForm = observer(function GeneralConfigurationForm(props: IGeneralConfigurationForm) {
  const { instance, instanceAdmins } = props;
  // hooks
  const { updateInstanceInfo } = useInstance();

  // form data
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Partial<IInstance>>({
    defaultValues: {
      instance_name: instance?.instance_name,
      is_telemetry_enabled: instance?.is_telemetry_enabled,
    },
  });

  const onSubmit = async (formData: Partial<IInstance>) => {
    const payload: Partial<IInstance> = { ...formData };

    try {
      await updateInstanceInfo(payload);
      // the saved values become the new baseline, so Save disables again until the next edit
      reset(formData);
      setToast({
        type: "success",
        title: "Success",
        message: "Settings updated successfully",
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="text-body-md-medium text-primary">Instance details</div>
        <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-8 md:grid-cols-2 lg:grid-cols-3">
          <ControllerInput
            key="instance_name"
            name="instance_name"
            control={control}
            type="text"
            label="Name of instance"
            placeholder="Instance name"
            error={Boolean(errors.instance_name)}
            required
          />

          <InputField
            id="email"
            name="email"
            type="email"
            size="lg"
            orientation="vertical"
            label="Email"
            value={instanceAdmins[0]?.user_detail?.email ?? ""}
            placeholder="Admin email"
            autoComplete="on"
            disabled
          />

          <InputField
            id="instance_id"
            name="instance_id"
            type="text"
            size="lg"
            orientation="vertical"
            label="Instance ID"
            value={instance.instance_id}
            disabled
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="border-b border-subtle pb-1.5 text-body-md-medium text-primary">Telemetry</div>
        <div className="flex items-center gap-14">
          <div className="flex grow items-center gap-4">
            <div className="shrink-0">
              <div className="flex size-11 items-center justify-center rounded-lg bg-layer-1">
                <UsageOutline className="size-5 text-tertiary" />
              </div>
            </div>
            <div className="grow">
              <div className="text-body-sm-medium leading-5 text-primary">Let Plane collect anonymous usage data</div>
              <div className="text-body-xs-regular leading-5 text-tertiary">
                No PII is collected.This anonymized data is used to understand how you use Plane and build new features
                in line with{" "}
                <a
                  href="https://developers.plane.so/self-hosting/telemetry"
                  target="_blank"
                  className="text-accent-primary hover:underline"
                  rel="noreferrer"
                >
                  our Telemetry Policy.
                </a>
              </div>
            </div>
          </div>
          <div className={`shrink-0 ${isSubmitting && "opacity-70"}`}>
            <Controller
              control={control}
              name="is_telemetry_enabled"
              render={({ field: { value, onChange } }) => (
                <Switch
                  aria-label="Let Plane collect anonymous usage data"
                  checked={value ?? false}
                  onCheckedChange={onChange}
                  size="sm"
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
        </div>
      </div>

      <div>
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          onClick={() => {
            void handleSubmit(onSubmit)();
          }}
          loading={isSubmitting}
          disabled={!isDirty}
          label={isSubmitting ? "Saving" : "Save changes"}
        />
      </div>
    </div>
  );
});
