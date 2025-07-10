"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { TGithubAppConfig } from "@plane/types";
import { Button, Input, setToast, TOAST_TYPE } from "@plane/ui";
import { useGithubIntegration } from "@/plane-web/hooks/store";

interface IGEAppFormProps {
  handleFormSubmitSuccess: () => Promise<void>;
  handleClose: () => void;
}

const singleUrlRegex =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

const defaultFormData: TGithubAppConfig = {
  appId: "",
  appName: "",
  baseUrl: "",
  clientId: "",
  clientSecret: "",
  privateKey: "",
  webhookSecret: "",
};

export const GithubEnterpriseServerAppForm: FC<IGEAppFormProps> = observer(
  ({ handleFormSubmitSuccess, handleClose }) => {
    // hooks
    const { t } = useTranslation();
    const {
      auth: { fetchAppConfigKey },
    } = useGithubIntegration(true);
    // states
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // form
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<TGithubAppConfig>({
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
            message: t("github_enterprise_integration.failed_to_create_app"),
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
            <div className="text-custom-text-200 font-medium mb-1">
              {t("github_enterprise_integration.app_form_title")}
            </div>
            <div className="text-sm text-custom-text-300 mb-4">
              {t("github_enterprise_integration.app_form_description")}
            </div>
          </div>
          <div>
            <div className="text-sm text-custom-text-300">{t("github_enterprise_integration.app_id_title")}</div>
            <Input
              id="appId"
              type="text"
              placeholder={t("github_enterprise_integration.app_id_placeholder")}
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.appId)}
              tabIndex={1}
              {...register("appId", { required: t("github_enterprise_integration.app_id_error") })}
            />
            <div className="text-xs text-custom-text-300 mt-1">
              {t("github_enterprise_integration.app_id_description")}
            </div>
            {errors.appId && <p className="text-red-500 text-xs">{errors.appId.message}</p>}
          </div>
          <div>
            <div className="text-sm text-custom-text-300">{t("github_enterprise_integration.app_name_title")}</div>
            <Input
              id="appName"
              type="text"
              placeholder={t("github_enterprise_integration.app_name_placeholder")}
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.appName)}
              tabIndex={1}
              {...register("appName", { required: t("github_enterprise_integration.app_name_error") })}
            />
            <div className="text-xs text-custom-text-300 mt-1">
              {t("github_enterprise_integration.app_name_description")}
            </div>
            {errors.appName && <p className="text-red-500 text-xs">{errors.appName.message}</p>}
          </div>
          <div>
            <div className="text-sm text-custom-text-300">{t("github_enterprise_integration.base_url_title")}</div>
            <Input
              id="baseUrl"
              type="text"
              placeholder={t("github_enterprise_integration.base_url_placeholder")}
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.baseUrl)}
              tabIndex={1}
              {...register("baseUrl", {
                required: t("github_enterprise_integration.base_url_error"),
                pattern: {
                  value: singleUrlRegex,
                  message: t("github_enterprise_integration.invalid_base_url_error"),
                },
              })}
            />
            <div className="text-xs text-custom-text-300 mt-1">
              {t("github_enterprise_integration.base_url_description")}
            </div>
            {errors.baseUrl && <p className="text-red-500 text-xs">{errors.baseUrl.message}</p>}
          </div>
          <div>
            <div className="text-sm text-custom-text-300">{t("github_enterprise_integration.client_id_title")}</div>
            <Input
              id="clientId"
              type="text"
              placeholder={t("github_enterprise_integration.client_id_placeholder")}
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.clientId)}
              tabIndex={1}
              {...register("clientId", { required: t("github_enterprise_integration.client_id_error") })}
            />
            <div className="text-xs text-custom-text-300 mt-1">
              {t("github_enterprise_integration.client_id_description")}
            </div>
            {errors.clientId && <p className="text-red-500 text-xs">{errors.clientId.message}</p>}
          </div>
          <div>
            <div className="text-sm text-custom-text-300">{t("github_enterprise_integration.client_secret_title")}</div>
            <Input
              id="clientSecret"
              type="text"
              placeholder={t("github_enterprise_integration.client_secret_placeholder")}
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.clientSecret)}
              tabIndex={1}
              {...register("clientSecret", { required: t("github_enterprise_integration.client_secret_error") })}
            />
            <div className="text-xs text-custom-text-300 mt-1">
              {t("github_enterprise_integration.client_secret_description")}
            </div>
            {errors.clientSecret && <p className="text-red-500 text-xs">{errors.clientSecret.message}</p>}
          </div>

          <div>
            <div className="text-sm text-custom-text-300">
              {t("github_enterprise_integration.webhook_secret_title")}
            </div>
            <Input
              id="webhookSecret"
              type="text"
              placeholder={t("github_enterprise_integration.webhook_secret_placeholder")}
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.webhookSecret)}
              tabIndex={1}
              {...register("webhookSecret", { required: t("github_enterprise_integration.webhook_secret_error") })}
            />
            <div className="text-xs text-custom-text-300 mt-1">
              {t("github_enterprise_integration.webhook_secret_description")}
            </div>
            {errors.webhookSecret && <p className="text-red-500 text-xs">{errors.webhookSecret.message}</p>}
          </div>
          <div>
            <div className="text-sm text-custom-text-300">{t("github_enterprise_integration.private_key_title")}</div>
            <Input
              id="privateKey"
              type="text"
              placeholder={t("github_enterprise_integration.private_key_placeholder")}
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.privateKey)}
              aria-multiline
              aria-rowcount={4}
              tabIndex={1}
              {...register("privateKey", { required: t("github_enterprise_integration.private_key_error") })}
            />
            <div className="text-xs text-custom-text-300 mt-1">
              {t("github_enterprise_integration.private_key_description")}
            </div>
            {errors.privateKey && <p className="text-red-500 text-xs">{errors.privateKey.message}</p>}
          </div>
          <div className="flex justify-start gap-2 mt-10">
            <Button type="button" variant="outline-primary" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting} loading={isSubmitting} variant="primary">
              {t("github_enterprise_integration.connect_app")}
            </Button>
          </div>
        </div>
      </form>
    );
  }
);
