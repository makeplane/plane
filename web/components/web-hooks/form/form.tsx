import React, { FC, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
// components
import {
  WebhookIndividualEventOptions,
  WebhookInput,
  WebhookOptions,
  WebhookSecretKey,
  WebhookToggle,
  getCurrentHookAsCSV,
} from "components/web-hooks";
// ui
import { Button } from "@plane/ui";
// helpers
import { csvDownload } from "helpers/download.helper";
// types
import { IWebhook, TWebhookEventTypes } from "types";

type Props = {
  data?: Partial<IWebhook>;
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
  const { data } = props;
  // states
  const [webhookEventType, setWebhookEventType] = useState<TWebhookEventTypes>("all");
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // toast
  const { setToastAlert } = useToast();
  // mobx store
  const {
    webhook: { createWebhook, updateWebhook },
    workspace: { currentWorkspace },
  } = useMobxStore();
  // use form
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm<IWebhook>({
    defaultValues: { ...initialWebhookPayload, ...data },
  });

  const handleCreateWebhook = async (formData: IWebhook) => {
    if (!workspaceSlug) return;

    let payload: Partial<IWebhook> = {
      url: formData.url,
    };

    if (webhookEventType === "all")
      payload = {
        ...payload,
        project: true,
        cycle: true,
        module: true,
        issue: true,
        issue_comment: true,
      };
    else
      payload = {
        ...payload,
        project: formData.project ?? false,
        cycle: formData.cycle ?? false,
        module: formData.module ?? false,
        issue: formData.issue ?? false,
        issue_comment: formData.issue_comment ?? false,
      };

    await createWebhook(workspaceSlug.toString(), payload)
      .then(({ webHook, secretKey }) => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Webhook created successfully.",
        });

        const csvData = getCurrentHookAsCSV(currentWorkspace, webHook, secretKey);
        csvDownload(csvData, `webhook-secret-key-${Date.now()}`);

        if (webHook && webHook.id)
          router.push({ pathname: `/${workspaceSlug}/settings/webhooks/${webHook.id}`, query: { isCreated: true } });
      })
      .catch((error) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: error?.error ?? "Something went wrong. Please try again.",
        });
      });
  };

  const handleUpdateWebhook = async (formData: IWebhook) => {
    if (!workspaceSlug || !data || !data.id) return;

    const payload = {
      url: formData?.url,
      is_active: formData?.is_active,
      project: formData?.project,
      cycle: formData?.cycle,
      module: formData?.module,
      issue: formData?.issue,
      issue_comment: formData?.issue_comment,
    };

    return await updateWebhook(workspaceSlug.toString(), data.id, payload);
  };

  const handleFormSubmit = async (formData: IWebhook) => {
    if (data) await handleUpdateWebhook(formData);
    else await handleCreateWebhook(formData);
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
        <div className="space-y-8 mt-8">
          {data && <WebhookSecretKey data={data} />}
          <Button type="submit" loading={isSubmitting}>
            {data ? (isSubmitting ? "Updating..." : "Update") : isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
});
