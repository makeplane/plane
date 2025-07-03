"use client";

import React, { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { IWebhook, TWebhookEventTypes } from "@plane/types";
// hooks
import { Button } from "@plane/ui";
import {
  WebhookIndividualEventOptions,
  WebhookInput,
  WebhookOptions,
  WebhookSecretKey,
  WebhookToggle,
} from "@/components/web-hooks";
import { useWebhook } from "@/hooks/store";
// components
// ui
// types

type Props = {
  data?: Partial<IWebhook>;
  onSubmit: (data: IWebhook, webhookEventType: TWebhookEventTypes) => Promise<void>;
  handleClose?: () => void;
};

const initialWebhookPayload: Partial<IWebhook> = {
  cycle: true,
  issue: true,
  issue_comment: true,
  module: true,
  project: true,
  url: "",
};

export const WebhookForm: FC<Props> = observer((props) => {
  const { data, onSubmit, handleClose } = props;
  // states
  const [webhookEventType, setWebhookEventType] = useState<TWebhookEventTypes>("all");
  // store hooks
  const { webhookSecretKey } = useWebhook();
  const { t } = useTranslation();
  // use form
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm<IWebhook>({
    defaultValues: { ...initialWebhookPayload, ...data },
  });

  const handleFormSubmit = async (formData: IWebhook) => {
    await onSubmit(formData, webhookEventType);
  };

  useEffect(() => {
    if (!data) return;

    if (data.project && data.cycle && data.module && data.issue && data.issue_comment) setWebhookEventType("all");
    else setWebhookEventType("individual");
  }, [data]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="space-y-5 ">
        <div className="text-xl font-medium text-custom-text-200">
          {data
            ? t("workspace_settings.settings.webhooks.modal.details")
            : t("workspace_settings.settings.webhooks.modal.title")}
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Controller
              control={control}
              name="url"
              rules={{
                required: t("workspace_settings.settings.webhooks.modal.error"),
              }}
              render={({ field: { onChange, value } }) => (
                <WebhookInput value={value} onChange={onChange} hasError={Boolean(errors.url)} />
              )}
            />
            {errors.url && <div className="text-xs text-red-500">{errors.url.message}</div>}
          </div>
          {data && <WebhookToggle control={control} />}
          <WebhookOptions value={webhookEventType} onChange={(val) => setWebhookEventType(val)} />
        </div>
        <div className="mt-4">
          {webhookEventType === "individual" && <WebhookIndividualEventOptions control={control} />}
        </div>
      </div>
      {data ? (
        <div className="pt-0 space-y-5">
          <WebhookSecretKey data={data} />
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? t("updating") : t("update")}
          </Button>
        </div>
      ) : (
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            {t("cancel")}
          </Button>
          {!webhookSecretKey && (
            <Button type="submit" variant="primary" size="sm" loading={isSubmitting} className="capitalize">
              {isSubmitting ? t("common.creating") : t("common.create")}
            </Button>
          )}
        </div>
      )}
    </form>
  );
});
