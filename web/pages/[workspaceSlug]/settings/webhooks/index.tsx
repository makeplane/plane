import React from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// layout
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { WebhookLists, EmptyWebhooks } from "components/web-hooks";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { RootStore } from "store/root";
import { Spinner } from "@plane/ui";

const Webhooks: NextPage = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const { webhook: webhookStore }: RootStore = useMobxStore();

  const { isLoading } = useSWR(
    workspaceSlug ? `WEBHOOKS_LIST_${workspaceSlug}` : null,
    workspaceSlug
      ? async () => {
        await webhookStore.fetchAll(workspaceSlug);
      }
      : null
  );

  return (
    <AppLayout header={<WorkspaceSettingHeader title="Webhook Settings" />}>
      <WorkspaceSettingLayout>
        <div className="w-full overflow-y-auto py-3 pr-4">
          {webhookStore.webhooks.length > 0 ? isLoading ? <div className="flex h-full w-ful items-center justify-center" >
            <Spinner /> 
          </div> : (
            <WebhookLists workspaceSlug={workspaceSlug} />
          ) : (
            <EmptyWebhooks workspaceSlug={workspaceSlug} />
          )}
        </div>
      </WorkspaceSettingLayout>
    </AppLayout>
  );
});

export default Webhooks;
