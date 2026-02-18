/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { isEmpty } from "lodash-es";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Monitor } from "lucide-react";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceGithubAuthenticationConfigurationKeys } from "@plane/types";
// components
import { CodeBlock } from "@/components/common/code-block";
import { ConfirmDiscardModal } from "@/components/common/confirm-discard-modal";
import type { TControllerInputFormField } from "@/components/common/controller-input";
import type { TControllerSwitchFormField } from "@/components/common/controller-switch";
import { ControllerSwitch } from "@/components/common/controller-switch";
import { ControllerInput } from "@/components/common/controller-input";
import type { TCopyField } from "@/components/common/copy-field";
import { CopyField } from "@/components/common/copy-field";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  config: IFormattedInstanceConfiguration;
};

type GithubConfigFormValues = Record<TInstanceGithubAuthenticationConfigurationKeys, string>;

export function InstanceGithubConfigForm(props: Props) {
  const { config } = props;
  // states
  const [isDiscardChangesModalOpen, setIsDiscardChangesModalOpen] = useState(false);
  // store hooks
  const { t } = useTranslation();
  const { updateInstanceConfigurations } = useInstance();
  // form data
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<GithubConfigFormValues>({
    defaultValues: {
      GITHUB_CLIENT_ID: config["GITHUB_CLIENT_ID"],
      GITHUB_CLIENT_SECRET: config["GITHUB_CLIENT_SECRET"],
      GITHUB_ORGANIZATION_ID: config["GITHUB_ORGANIZATION_ID"],
      ENABLE_GITHUB_SYNC: config["ENABLE_GITHUB_SYNC"] || "0",
    },
  });

  const originURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";

  const GITHUB_FORM_FIELDS: TControllerInputFormField[] = [
    {
      key: "GITHUB_CLIENT_ID",
      type: "text",
      label: t("admin.google_client_id_label"),
      description: (
        <>
          {t("admin.github_client_id_description")}{" "}
          <a
            tabIndex={-1}
            href="https://github.com/settings/applications/new"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            {t("admin.github_oauth_apps_link")}
          </a>
        </>
      ),
      placeholder: "70a44354520df8bd9bcd",
      error: Boolean(errors.GITHUB_CLIENT_ID),
      required: true,
    },
    {
      key: "GITHUB_CLIENT_SECRET",
      type: "password",
      label: t("admin.google_client_secret_label"),
      description: (
        <>
          {t("admin.google_client_secret_description")}{" "}
          <a
            tabIndex={-1}
            href="https://github.com/settings/applications/new"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            {t("admin.github_oauth_apps_link")}
          </a>
        </>
      ),
      placeholder: "9b0050f94ec1b744e32ce79ea4ffacd40d4119cb",
      error: Boolean(errors.GITHUB_CLIENT_SECRET),
      required: true,
    },
    {
      key: "GITHUB_ORGANIZATION_ID",
      type: "text",
      label: t("admin.github_org_id_label"),
      description: <>{t("admin.github_org_id_description")}</>,
      placeholder: "123456789",
      error: Boolean(errors.GITHUB_ORGANIZATION_ID),
      required: false,
    },
  ];

  const GITHUB_FORM_SWITCH_FIELD: TControllerSwitchFormField<GithubConfigFormValues> = {
    name: "ENABLE_GITHUB_SYNC",
    label: t("admin.github_sync_label"),
  };

  const GITHUB_COMMON_SERVICE_DETAILS: TCopyField[] = [
    {
      key: "Origin_URL",
      label: t("admin.origin_url_label"),
      url: originURL,
      description: (
        <>
          {t("admin.origin_url_description")} <CodeBlock darkerShade>{t("admin.auth_origin_url_field")}</CodeBlock>{" "}
          {t("admin.origin_url_suffix")}{" "}
          <a
            tabIndex={-1}
            href="https://github.com/settings/applications/new"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            {t("common.here")}
          </a>
        </>
      ),
    },
  ];

  const GITHUB_SERVICE_DETAILS: TCopyField[] = [
    {
      key: "Callback_URI",
      label: t("admin.callback_uri_label"),
      url: `${originURL}/auth/github/callback/`,
      description: (
        <>
          {t("admin.callback_uri_description")} <CodeBlock darkerShade>{t("admin.auth_callback_uri_field")}</CodeBlock>{" "}
          {t("admin.origin_url_suffix")}{" "}
          <a
            tabIndex={-1}
            href="https://github.com/settings/applications/new"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            {t("common.here")}
          </a>
        </>
      ),
    },
  ];

  const onSubmit = async (formData: GithubConfigFormValues) => {
    const payload: Partial<GithubConfigFormValues> = { ...formData };

    try {
      const response = await updateInstanceConfigurations(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("admin.google_auth_configured_title"),
        message: t("admin.github_auth_configured_message"),
      });
      reset({
        GITHUB_CLIENT_ID: response.find((item) => item.key === "GITHUB_CLIENT_ID")?.value,
        GITHUB_CLIENT_SECRET: response.find((item) => item.key === "GITHUB_CLIENT_SECRET")?.value,
        GITHUB_ORGANIZATION_ID: response.find((item) => item.key === "GITHUB_ORGANIZATION_ID")?.value,
        ENABLE_GITHUB_SYNC: response.find((item) => item.key === "ENABLE_GITHUB_SYNC")?.value,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoBack = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (isDirty) {
      e.preventDefault();
      setIsDiscardChangesModalOpen(true);
    }
  };

  return (
    <>
      <ConfirmDiscardModal
        isOpen={isDiscardChangesModalOpen}
        onDiscardHref="/authentication"
        handleClose={() => setIsDiscardChangesModalOpen(false)}
      />
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 w-full">
          <div className="flex flex-col gap-y-4 col-span-2 md:col-span-1 pt-1">
            <div className="pt-2.5 text-18 font-medium">{t("admin.github_provided_details_title")}</div>
            {GITHUB_FORM_FIELDS.map((field) => (
              <ControllerInput
                key={field.key}
                control={control}
                type={field.type}
                name={field.key}
                label={field.label}
                description={field.description}
                placeholder={field.placeholder}
                error={field.error}
                required={field.required}
              />
            ))}
            <ControllerSwitch control={control} field={GITHUB_FORM_SWITCH_FIELD} />
            <div className="flex flex-col gap-1 pt-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={(e) => void handleSubmit(onSubmit)(e)}
                  loading={isSubmitting}
                  disabled={!isDirty}
                >
                  {isSubmitting ? t("saving") : t("save_changes")}
                </Button>
                <Link href="/authentication" className={getButtonStyling("secondary", "lg")} onClick={handleGoBack}>
                  {t("common.go_back")}
                </Link>
              </div>
            </div>
          </div>
          <div className="col-span-2 md:col-span-1 flex flex-col gap-y-6">
            <div className="pt-2 text-18 font-medium">{t("admin.plane_provided_details_github_title")}</div>

            <div className="flex flex-col gap-y-4">
              {/* common service details */}
              <div className="flex flex-col gap-y-4 px-6 py-4 bg-layer-1 rounded-lg">
                {GITHUB_COMMON_SERVICE_DETAILS.map((field) => (
                  <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
                ))}
              </div>

              {/* web service details */}
              <div className="flex flex-col rounded-lg overflow-hidden">
                <div className="px-6 py-3 bg-layer-3 font-medium text-11 uppercase flex items-center gap-x-3 text-secondary">
                  <Monitor className="w-3 h-3" />
                  {t("admin.web_title")}
                </div>
                <div className="px-6 py-4 flex flex-col gap-y-4 bg-layer-1">
                  {GITHUB_SERVICE_DETAILS.map((field) => (
                    <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
