import React, { useEffect } from "react";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingHeader } from "components/headers";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
import { WebhookDetails } from "components/web-hooks";
import { IWebhook, IExtendedWebhook } from "types";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";
import { renderDateFormat } from "helpers/date-time.helper";
import { csvDownload } from "helpers/download.helper";
import useToast from "hooks/use-toast";

const Webhooks: NextPage = () => {
  const router = useRouter();

  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const initialWebhookPayload: IWebhook = {
    url: "",
    is_active: true,
    created_at: "",
    updated_at: "",
    secret_key: "",
    project: true,
    issue_comment: true,
    cycle: true,
    module: true,
    issue: true,
    workspace: "",
  };

  const { webhook: webhookStore, workspace: workspaceStore }: RootStore = useMobxStore();

  const { setToastAlert } = useToast();

  const onSubmit = async (data: IExtendedWebhook) => {
    const payload = {
      url: data?.url,
      is_active: data?.is_active,
      project: data?.project,
      cycle: data?.cycle,
      module: data?.module,
      issue: data?.issue,
      issue_comment: data?.issue_comment,
    };

    return webhookStore
      .create(workspaceSlug, payload)
      .then((webhook) => {
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Successfully created",
        });
        csvDownload(
          [
            [
              "id",
              "url",
              "created_at",
              "updated_at",
              "is_active",
              "secret_key",
              "project",
              "issue",
              "module",
              "cycle",
              "issue_comment",
              "workspace",
            ],
            [
              webhook.id!,
              webhook.url!,
              renderDateFormat(webhook.updated_at!),
              renderDateFormat(webhook.created_at!),
              webhookStore.webhookSecretKey!,
              String(webhook.is_active!),
              String(webhook.issue!),
              String(webhook.project!),
              String(webhook.module!),
              String(webhook.cycle!),
              String(webhook.issue_comment!),
              workspaceStore.currentWorkspace?.name!,
            ],
          ],
          "Secret-key"
        );
      })
      .catch((error) => {
        setToastAlert({
          title: "Oops!",
          type: "error",
          message: error?.error ?? "Something went wrong!",
        });
      });
  };

  useEffect(() => {
    webhookStore.clearSecretKey();
  }, []);

  return (
    <AppLayout header={<WorkspaceSettingHeader title="Webhook Settings" />}>
      <WorkspaceSettingLayout>
        <div className="w-full overflow-y-auto py-3 pr-4">
          <WebhookDetails type="create" initialData={initialWebhookPayload} onSubmit={onSubmit} />
        </div>
      </WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default Webhooks;
