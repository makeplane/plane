/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { isEmpty } from "lodash-es";
import Link from "next/link";
import { useForm } from "react-hook-form";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceGitlabAuthenticationConfigurationKeys } from "@plane/types";
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

type GitlabConfigFormValues = Record<TInstanceGitlabAuthenticationConfigurationKeys, string>;

export function InstanceGitlabConfigForm(props: Props) {
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
  } = useForm<GitlabConfigFormValues>({
    defaultValues: {
      GITLAB_HOST: config["GITLAB_HOST"],
      GITLAB_CLIENT_ID: config["GITLAB_CLIENT_ID"],
      GITLAB_CLIENT_SECRET: config["GITLAB_CLIENT_SECRET"],
      ENABLE_GITLAB_SYNC: config["ENABLE_GITLAB_SYNC"] || "0",
    },
  });

  const originURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";

  const GITLAB_FORM_FIELDS: TControllerInputFormField[] = [
    {
      key: "GITLAB_HOST",
      type: "text",
      label: t("admin.email_host_label"),
      description: (
        <>
          {t("admin.gitlab_host_description")}
        </>
      ),
      placeholder: "https://gitlab.com",
      error: Boolean(errors.GITLAB_HOST),
      required: true,
    },
    {
      key: "GITLAB_CLIENT_ID",
      type: "text",
      label: t("admin.gitlab_app_id_label"),
      description: (
        <>
          {t("admin.google_client_id_description")}{" "}
          <a
            tabIndex={-1}
            href="https://docs.gitlab.com/ee/integration/oauth_provider.html"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            {t("admin.gitlab_oauth_apps_link")}
          </a>
          .
        </>
      ),
      placeholder: "c2ef2e7fc4e9d15aa7630f5637d59e8e4a27ff01dceebdb26b0d267b9adcf3c3",
      error: Boolean(errors.GITLAB_CLIENT_ID),
      required: true,
    },
    {
      key: "GITLAB_CLIENT_SECRET",
      type: "password",
      label: t("admin.gitlab_secret_label"),
      description: (
        <>
          {t("admin.google_client_secret_description")}{" "}
          <a
            tabIndex={-1}
            href="https://docs.gitlab.com/ee/integration/oauth_provider.html"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            {t("admin.gitlab_oauth_apps_link")}
          </a>
          .
        </>
      ),
      placeholder: "gloas-f79cfa9a03c97f6ffab303177a5a6778a53c61e3914ba093412f68a9298a1b28",
      error: Boolean(errors.GITLAB_CLIENT_SECRET),
      required: true,
    },
  ];

  const GITLAB_FORM_SWITCH_FIELD: TControllerSwitchFormField<GitlabConfigFormValues> = {
    name: "ENABLE_GITLAB_SYNC",
    label: t("admin.gitlab_sync_label"),
  };

  const GITLAB_SERVICE_FIELD: TCopyField[] = [
    {
      key: "Callback_URL",
      label: t("admin.callback_uri_label"),
      url: `${originURL}/auth/gitlab/callback/`,
      description: (
        <>
          {t("admin.callback_uri_description")} <CodeBlock darkerShade>{t("admin.gitlab_redirect_uri_field")}</CodeBlock> field of your{" "}
          <a
            tabIndex={-1}
            href="https://docs.gitlab.com/ee/integration/oauth_provider.html"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            {t("admin.gitlab_oauth_app_link")}
          </a>
          .
        </>
      ),
    },
  ];

  const onSubmit = async (formData: GitlabConfigFormValues) => {
    const payload: Partial<GitlabConfigFormValues> = { ...formData };

    try {
      const response = await updateInstanceConfigurations(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("admin.google_auth_configured_title"),
        message: t("admin.gitlab_auth_configured_message"),
      });
      reset({
        GITLAB_HOST: response.find((item) => item.key === "GITLAB_HOST")?.value,
        GITLAB_CLIENT_ID: response.find((item) => item.key === "GITLAB_CLIENT_ID")?.value,
        GITLAB_CLIENT_SECRET: response.find((item) => item.key === "GITLAB_CLIENT_SECRET")?.value,
        ENABLE_GITLAB_SYNC: response.find((item) => item.key === "ENABLE_GITLAB_SYNC")?.value,
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
            <div className="pt-2.5 text-18 font-medium">{t("admin.gitlab_provided_details_title")}</div>
            {GITLAB_FORM_FIELDS.map((field) => (
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
            <ControllerSwitch control={control} field={GITLAB_FORM_SWITCH_FIELD} />
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
          <div className="col-span-2 md:col-span-1">
            <div className="flex flex-col gap-y-4 px-6 pt-1.5 pb-4 bg-layer-3 rounded-lg">
              <div className="pt-2 text-18 font-medium">{t("admin.plane_provided_details_gitlab_title")}</div>
              {GITLAB_SERVICE_FIELD.map((field) => (
                <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
