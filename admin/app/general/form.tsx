"use client";
import { FC } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Telescope } from "lucide-react";
// types
import { IInstance, IInstanceAdmin } from "@plane/types";
// ui
import { Button, Input, TOAST_TYPE, ToggleSwitch, setToast } from "@plane/ui";
// components
import { ControllerInput } from "@/components/common";
import { useInstance } from "@/hooks/store";
import { IntercomConfig } from "./intercom";
// hooks

export interface IGeneralConfigurationForm {
  instance: IInstance;
  instanceAdmins: IInstanceAdmin[];
}

export const GeneralConfigurationForm: FC<IGeneralConfigurationForm> = observer((props) => {
  const { instance, instanceAdmins } = props;
  // hooks
  const { instanceConfigurations, updateInstanceInfo, updateInstanceConfigurations } = useInstance();

  // form data
  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
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
          title: "Success",
          message: "Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="text-lg font-medium">Instance details</div>
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

          <div className="flex flex-col gap-1">
            <h4 className="text-sm text-custom-text-300">Email</h4>
            <Input
              id="email"
              name="email"
              type="email"
              value={instanceAdmins[0]?.user_detail?.email ?? ""}
              placeholder="Admin email"
              className="w-full cursor-not-allowed !text-custom-text-400"
              autoComplete="on"
              disabled
            />
          </div>

          <div className="flex flex-col gap-1">
            <h4 className="text-sm text-custom-text-300">Instance ID</h4>
            <Input
              id="instance_id"
              name="instance_id"
              type="text"
              value={instance.instance_id}
              className="w-full cursor-not-allowed rounded-md font-medium !text-custom-text-400"
              disabled
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-lg font-medium">Chat + telemetry</div>
        <IntercomConfig isTelemetryEnabled={watch("is_telemetry_enabled") ?? false} />
        <div className="flex items-center gap-14 px-4 py-3 border border-custom-border-200 rounded">
          <div className="grow flex items-center gap-4">
            <div className="shrink-0">
              <div className="flex items-center justify-center w-10 h-10 bg-custom-background-80 rounded-full">
                <Telescope className="w-6 h-6 text-custom-text-300/80 p-0.5" />
              </div>
            </div>
            <div className="grow">
              <div className="text-sm font-medium text-custom-text-100 leading-5">
                Let Plane collect anonymous usage data
              </div>
              <div className="text-xs font-normal text-custom-text-300 leading-5">
                No PII is collected.This anonymized data is used to understand how you use Plane and build new features
                in line with{" "}
                <a
                  href="https://docs.plane.so/self-hosting/telemetry"
                  target="_blank"
                  className="text-custom-primary-100 hover:underline"
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
                <ToggleSwitch value={value ?? false} onChange={onChange} size="sm" disabled={isSubmitting} />
              )}
            />
          </div>
        </div>
      </div>

      <div>
        <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
});
