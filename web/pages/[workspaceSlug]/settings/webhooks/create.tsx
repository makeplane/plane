import React from "react";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingHeader } from "components/headers";
import { WorkspaceSettingLayout } from "layouts/setting-layout";
import { WebhookDetails } from "components/web-hooks";
import { IWebhook, IExtendedWebhook } from "types";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

const Webhooks: NextPage = () => {

  const router = useRouter();

  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const initialWebhookPayload: IWebhook = {
    url: "",
    is_active: true,
    secret_key: "",
    project: true,
    issue_comment: true,
    cycle: true,
    module: true,
    issue: true,
  };

  const { webhook: webhookStore }: RootStore = useMobxStore();


  const onSubmit = (data: IExtendedWebhook): Promise<IWebhook> => {
    const payload = {
      url: data?.url,
      is_active: data?.is_active,
      project: data?.project,
      cycle: data?.cycle,
      module: data?.module,
      issue: data?.issue,
      issue_comment: data?.issue_comment,
    }
    return webhookStore.create(workspaceSlug, payload);
  }

  return (
    <AppLayout header={<WorkspaceSettingHeader title="Webhook Settings" />} >
      <WorkspaceSettingLayout>
        <section className="pr-9 py-8 w-full overflow-y-auto">
          <WebhookDetails type='create' initialData={initialWebhookPayload} onSubmit={onSubmit} />
        </section>
      </WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default Webhooks;