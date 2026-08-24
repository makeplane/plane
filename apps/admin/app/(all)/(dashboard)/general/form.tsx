/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Telescope } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type {
  IFormattedInstanceConfiguration,
  IInstance,
  IInstanceAdmin,
  TInstanceBrandingConfigurationKeys,
} from "@plane/types";
import { Input, ToggleSwitch } from "@plane/ui";
// components
import { ControllerInput } from "@/components/common/controller-input";
// hooks
import { useInstance } from "@/hooks/store";

type BrandingFormValues = Record<TInstanceBrandingConfigurationKeys, string>;

export interface IGeneralConfigurationForm {
  instance: IInstance;
  instanceAdmins: IInstanceAdmin[];
  config: IFormattedInstanceConfiguration;
}

export const GeneralConfigurationForm = observer(function GeneralConfigurationForm(props: IGeneralConfigurationForm) {
  const { instance, instanceAdmins, config } = props;
  // hooks
  const { updateInstanceInfo, updateInstanceConfigurations, fetchInstanceInfo } = useInstance();

  // form data
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Partial<IInstance> & BrandingFormValues>({
    defaultValues: {
      instance_name: instance?.instance_name,
      is_telemetry_enabled: instance?.is_telemetry_enabled,
      BRAND_LOGO_URL: config.BRAND_LOGO_URL ?? "",
      BRAND_LOGO_DARK_URL: config.BRAND_LOGO_DARK_URL ?? "",
      BRAND_FAVICON_URL: config.BRAND_FAVICON_URL ?? "",
      BRAND_SUPPORT_EMAIL: config.BRAND_SUPPORT_EMAIL ?? "",
      BRAND_WEBSITE_URL: config.BRAND_WEBSITE_URL ?? "",
      HIDE_PLANE_MARKETING: config.HIDE_PLANE_MARKETING ?? "0",
    },
  });

  const onSubmit = async (formData: Partial<IInstance> & BrandingFormValues) => {
    const {
      instance_name,
      is_telemetry_enabled,
      BRAND_LOGO_URL,
      BRAND_LOGO_DARK_URL,
      BRAND_FAVICON_URL,
      BRAND_SUPPORT_EMAIL,
      BRAND_WEBSITE_URL,
      HIDE_PLANE_MARKETING,
    } = formData;

    try {
      await updateInstanceInfo({ instance_name, is_telemetry_enabled });
      await updateInstanceConfigurations({
        BRAND_LOGO_URL: BRAND_LOGO_URL ?? "",
        BRAND_LOGO_DARK_URL: BRAND_LOGO_DARK_URL ?? "",
        BRAND_FAVICON_URL: BRAND_FAVICON_URL ?? "",
        BRAND_SUPPORT_EMAIL: BRAND_SUPPORT_EMAIL ?? "",
        BRAND_WEBSITE_URL: BRAND_WEBSITE_URL ?? "",
        HIDE_PLANE_MARKETING: HIDE_PLANE_MARKETING === "1" ? "1" : "0",
      });
      await fetchInstanceInfo();
      setToast({
        type: TOAST_TYPE.SUCCESS,
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
        <div className="text-16 font-medium text-primary">Instance details</div>
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
            <h4 className="text-13 text-tertiary">Email</h4>
            <Input
              id="email"
              name="email"
              type="email"
              value={instanceAdmins[0]?.user_detail?.email ?? ""}
              placeholder="Admin email"
              className="w-full cursor-not-allowed !text-placeholder"
              autoComplete="on"
              disabled
            />
          </div>

          <div className="flex flex-col gap-1">
            <h4 className="text-13 text-tertiary">Instance ID</h4>
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

      <div className="space-y-4">
        <div className="border-b border-subtle pb-1.5 text-16 font-medium text-primary">Branding</div>
        <p className="text-13 text-tertiary">
          Optional white-label chrome for this instance. Leave fields empty to keep Plane defaults.
        </p>
        <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-8 md:grid-cols-2 lg:grid-cols-3">
          <ControllerInput
            key="BRAND_LOGO_URL"
            name="BRAND_LOGO_URL"
            control={control}
            type="text"
            label="Logo URL"
            placeholder="https://cdn.example.com/logo.svg"
            error={Boolean(errors.BRAND_LOGO_URL)}
            required={false}
          />
          <ControllerInput
            key="BRAND_LOGO_DARK_URL"
            name="BRAND_LOGO_DARK_URL"
            control={control}
            type="text"
            label="Dark theme logo URL"
            placeholder="https://cdn.example.com/logo-dark.svg"
            error={Boolean(errors.BRAND_LOGO_DARK_URL)}
            required={false}
          />
          <ControllerInput
            key="BRAND_FAVICON_URL"
            name="BRAND_FAVICON_URL"
            control={control}
            type="text"
            label="Favicon URL"
            placeholder="https://cdn.example.com/favicon.ico"
            error={Boolean(errors.BRAND_FAVICON_URL)}
            required={false}
          />
          <ControllerInput
            key="BRAND_SUPPORT_EMAIL"
            name="BRAND_SUPPORT_EMAIL"
            control={control}
            type="text"
            label="Support email"
            placeholder="support@example.com"
            error={Boolean(errors.BRAND_SUPPORT_EMAIL)}
            required={false}
          />
          <ControllerInput
            key="BRAND_WEBSITE_URL"
            name="BRAND_WEBSITE_URL"
            control={control}
            type="text"
            label="Website URL"
            placeholder="https://example.com"
            error={Boolean(errors.BRAND_WEBSITE_URL)}
            required={false}
          />
        </div>
        <div className="flex items-center gap-14">
          <div className="grow">
            <div className="text-13 leading-5 font-medium text-primary">Hide Plane marketing</div>
            <div className="text-11 leading-5 font-regular text-tertiary">
              Hide pricing, Powered by Plane, and other Plane Cloud upsell links in the product chrome.
            </div>
          </div>
          <div className={`shrink-0 ${isSubmitting && "opacity-70"}`}>
            <Controller
              control={control}
              name="HIDE_PLANE_MARKETING"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch
                  value={value === "1"}
                  onChange={(checked) => onChange(checked ? "1" : "0")}
                  size="sm"
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border-b border-subtle pb-1.5 text-16 font-medium text-primary">Telemetry</div>
        <div className="flex items-center gap-14">
          <div className="flex grow items-center gap-4">
            <div className="shrink-0">
              <div className="flex size-11 items-center justify-center rounded-lg bg-layer-1">
                <Telescope className="size-5 text-tertiary" />
              </div>
            </div>
            <div className="grow">
              <div className="text-13 leading-5 font-medium text-primary">Let Plane collect anonymous usage data</div>
              <div className="text-11 leading-5 font-regular text-tertiary">
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
                <ToggleSwitch value={value ?? false} onChange={onChange} size="sm" disabled={isSubmitting} />
              )}
            />
          </div>
        </div>
      </div>

      <div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            void handleSubmit(onSubmit)();
          }}
          loading={isSubmitting}
        >
          {isSubmitting ? "Saving" : "Save changes"}
        </Button>
      </div>
    </div>
  );
});
