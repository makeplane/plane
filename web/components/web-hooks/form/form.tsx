import React, { FC, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  WebhookIndividualEventOptions,
  WebhookInput,
  WebhookOptions,
  WebhookSecretKey,
  WebhookToggle,
} from "components/web-hooks";
// ui
import { Button } from "@plane/ui";
// types
import { IWebhook, TWebhookEventTypes } from "types";

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
  // mobx store
  const {
    webhook: { webhookSecretKey },
  } = useMobxStore();
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
    <div className="space-y-6">
      <div className="text-xl font-medium">{data ? "Webhook details" : "Create webhook"}</div>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-8">
          <div>
            <Controller
              control={control}
              name="url"
              rules={{
                required: "URL is required",
              }}
              render={({ field: { onChange, value } }) => (
                <WebhookInput value={value} onChange={onChange} hasError={Boolean(errors.url)} />
              )}
            />
            {errors.url && <div className="text-xs text-red-500">{errors.url.message}</div>}
          </div>
          {data && <WebhookToggle control={control} />}
          <div className="space-y-3">
            <WebhookOptions value={webhookEventType} onChange={(val) => setWebhookEventType(val)} />
          </div>
        </div>
        <div className="mt-4">
          {webhookEventType === "individual" && <WebhookIndividualEventOptions control={control} />}
        </div>
        {data ? (
          <div className="mt-8 space-y-8">
            <WebhookSecretKey data={data} />

            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update"}
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="neutral-primary" onClick={handleClose}>
              Discard
            </Button>
            {!webhookSecretKey && (
              <Button type="submit" variant="primary" loading={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
});
