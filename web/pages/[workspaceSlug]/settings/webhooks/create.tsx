import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { useUser, useWebhook, useWorkspace } from "hooks/store";
import useToast from "hooks/use-toast";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { WebhookForm, getCurrentHookAsCSV } from "components/web-hooks";
// types
import { NextPageWithLayout } from "lib/types";
import { IWebhook } from "@plane/types";
// helpers
import { csvDownload } from "helpers/download.helper";

const CreateWebhookPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { createWebhook } = useWebhook();
  const { currentWorkspace } = useWorkspace();

  const { setToastAlert } = useToast();
  const isAdmin = currentWorkspaceRole === 20;

  const handleCreateWebhook = async (formData: IWebhook, webhookEventType: string) => {
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

        const csvData = getCurrentHookAsCSV(currentWorkspace, webHook, secretKey?.toString() ?? "");
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

  const handleFormSubmit = async (formData: IWebhook, webhookEventType: string) => {
    await handleCreateWebhook(formData, webhookEventType);
  };

  if (!isAdmin)
    return (
      <div className="mt-10 flex h-full w-full justify-center p-4">
        <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
      </div>
    );

  return (
    <div className="w-full overflow-y-auto py-8 pl-1 pr-9">
      <WebhookForm onSubmit={handleFormSubmit} />
    </div>
  );
});

CreateWebhookPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Webhook settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default CreateWebhookPage;
