import React, { useEffect } from "react";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingHeader } from "components/headers";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
import { WebHookForm } from "components/web-hooks";
import { IWebhook, IExtendedWebhook } from "types";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";
import { csvDownload } from "helpers/download.helper";
import useToast from "hooks/use-toast";
import { WebHookFormTypes } from "components/web-hooks/form";
import { getCurrentHookAsCSV } from "components/web-hooks/utils";

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
      .then(({ webHook, secretKey }) => {
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Successfully created",
        });
        const csvData = getCurrentHookAsCSV(workspaceStore.currentWorkspace, webHook, secretKey);
        csvDownload(csvData, `Secret-key-${Date.now()}`);

        if (webHook && webHook.id) {
          router.push({ pathname: `/${workspaceSlug}/settings/webhooks/${webHook.id}`, query: { isCreated: true } });
        }
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
          <WebHookForm type={WebHookFormTypes.CREATE} initialData={initialWebhookPayload} onSubmit={onSubmit} />
        </div>
      </WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default Webhooks;
