import React from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingHeader } from "components/headers";
import { WorkspaceSettingLayout } from "layouts/setting-layout";
import { WebhookLists, EmptyWebhooks } from "components/web-hooks";
import { WebhookService } from "services/webhook.service";
import useSWR from "swr";
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { observer } from "mobx-react-lite";

const webhookService = new WebhookService();

const Webhooks: NextPage = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const { webhook: webhookStore }: RootStore = useMobxStore();

  useSWR(
    "WEBHOOKS_LIST",
    workspaceSlug
      ? () => webhookStore.fetchAll(workspaceSlug)
      : null
  );



  return (
    <AppLayout header={<WorkspaceSettingHeader title="Webhook Settings" />} >
      <WorkspaceSettingLayout>
        <section className="pr-9 py-8 w-full overflow-y-auto">
          {webhookStore.webhooks.length > 0 ? <WebhookLists workspaceSlug={workspaceSlug} /> : <EmptyWebhooks workspaceSlug={workspaceSlug} />}
        </section>
      </WorkspaceSettingLayout>
    </AppLayout>
  );
});

export default Webhooks;
