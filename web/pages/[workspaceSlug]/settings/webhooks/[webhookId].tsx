import React from "react";
import type { NextPage } from "next";
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingHeader } from "components/headers";
import { WorkspaceSettingLayout } from "layouts/setting-layout";
import { WebhookDetails } from "components/web-hooks";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { IExtendedWebhook, IWebhook } from "types";

const Webhooks: NextPage = observer(() => {

  const router = useRouter()
  const { workspaceSlug, webhookId } = router.query as { workspaceSlug: string, webhookId: string }

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
          <WebhookDetails onSubmit={onSubmit} />
        </section>
      </WorkspaceSettingLayout>
    </AppLayout>
  );
});

export default Webhooks;