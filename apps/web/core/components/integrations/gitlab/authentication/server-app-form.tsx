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
import { useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TGitlabAppConfig } from "@plane/types";
import { Input } from "@plane/ui";
import { useGitlabIntegration } from "@/plane-web/hooks/store";

interface IGEAppFormProps {
  handleFormSubmitSuccess: () => Promise<void>;
  handleClose: () => void;
}

const singleUrlRegex =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,20}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

const defaultFormData: TGitlabAppConfig = {
  baseUrl: "",
  clientId: "",
  clientSecret: "",
  webhookSecret: "",
};

export const GitlabEnterpriseServerAppForm = observer(function GitlabEnterpriseServerAppForm({
  handleFormSubmitSuccess,
  handleClose,
}: IGEAppFormProps) {
  // hooks
  const { t } = useTranslation();
  const {
    auth: { fetchAppConfigKey },
  } = useGitlabIntegration(true);
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TGitlabAppConfig>({
    defaultValues: defaultFormData,
  });

  const handleAppFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    handleSubmit(async (data) => {
      try {
        await fetchAppConfigKey(data);
        await handleFormSubmitSuccess();
      } catch (error) {
        console.log("Error in submitting application form:", error);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error"),
          message: t("gitlab_enterprise_integration.failed_to_create_app"),
        });
      } finally {
        setIsSubmitting(false);
      }
    })();
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleAppFormSubmit}>
      <div className="space-y-4 p-4">
        <div className="space-y-1">
          <div className="text-secondary font-medium mb-1">{t("gitlab_enterprise_integration.app_form_title")}</div>
          <div className="text-body-xs-regular text-tertiary mb-4">
            {t("gitlab_enterprise_integration.app_form_description")}
          </div>
        </div>
        <div>
          <div className="text-body-xs-regular text-tertiary">{t("gitlab_enterprise_integration.base_url_title")}</div>
          <Input
            id="baseUrl"
            type="text"
            placeholder={t("gitlab_enterprise_integration.base_url_placeholder")}
            className="w-full resize-none text-body-xs-regular"
            hasError={Boolean(errors.baseUrl)}
            tabIndex={1}
            {...register("baseUrl", {
              required: t("gitlab_enterprise_integration.base_url_error"),
              pattern: {
                value: singleUrlRegex,
                message: t("gitlab_enterprise_integration.invalid_base_url_error"),
              },
            })}
          />
          <div className="text-caption-sm-regular text-tertiary mt-1">
            {t("gitlab_enterprise_integration.base_url_description")}
          </div>
          {errors.baseUrl && <p className="text-danger-primary text-caption-sm-regular">{errors.baseUrl.message}</p>}
        </div>
        <div>
          <div className="text-body-xs-regular text-tertiary">{t("gitlab_enterprise_integration.client_id_title")}</div>
          <Input
            id="clientId"
            type="text"
            placeholder={t("gitlab_enterprise_integration.client_id_placeholder")}
            className="w-full resize-none text-body-xs-regular"
            hasError={Boolean(errors.clientId)}
            tabIndex={1}
            {...register("clientId", { required: t("gitlab_enterprise_integration.client_id_error") })}
          />
          <div className="text-caption-sm-regular text-tertiary mt-1">
            {t("gitlab_enterprise_integration.client_id_description")}
          </div>
          {errors.clientId && <p className="text-danger-primary text-caption-sm-regular">{errors.clientId.message}</p>}
        </div>
        <div>
          <div className="text-body-xs-regular text-tertiary">
            {t("gitlab_enterprise_integration.client_secret_title")}
          </div>
          <Input
            id="clientSecret"
            type="text"
            placeholder={t("gitlab_enterprise_integration.client_secret_placeholder")}
            className="w-full resize-none text-body-xs-regular"
            hasError={Boolean(errors.clientSecret)}
            tabIndex={1}
            {...register("clientSecret", { required: t("gitlab_enterprise_integration.client_secret_error") })}
          />
          <div className="text-caption-sm-regular text-tertiary mt-1">
            {t("gitlab_enterprise_integration.client_secret_description")}
          </div>
          {errors.clientSecret && (
            <p className="text-danger-primary text-caption-sm-regular">{errors.clientSecret.message}</p>
          )}
        </div>

        <div>
          <div className="text-body-xs-regular text-tertiary">
            {t("gitlab_enterprise_integration.webhook_secret_title")}
          </div>
          <Input
            id="webhookSecret"
            type="text"
            placeholder={t("gitlab_enterprise_integration.webhook_secret_placeholder")}
            className="w-full resize-none text-body-xs-regular"
            hasError={Boolean(errors.webhookSecret)}
            tabIndex={1}
            {...register("webhookSecret", { required: t("gitlab_enterprise_integration.webhook_secret_error") })}
          />
          <div className="text-caption-sm-regular text-tertiary mt-1">
            {t("gitlab_enterprise_integration.webhook_secret_description")}
          </div>
          {errors.webhookSecret && (
            <p className="text-danger-primary text-caption-sm-regular">{errors.webhookSecret.message}</p>
          )}
        </div>
        <div className="flex justify-start gap-2 mt-10">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting} variant="primary">
            {t("gitlab_enterprise_integration.connect_app")}
          </Button>
        </div>
      </div>
    </form>
  );
});
