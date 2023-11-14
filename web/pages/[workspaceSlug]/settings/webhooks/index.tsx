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

const WebhooksPage: NextPage = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const {
    webhook: { fetchWebhooks, webhooks, loader },
  }: RootStore = useMobxStore();

  useSWR(
    workspaceSlug ? `WEBHOOKS_LIST_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWebhooks(workspaceSlug) : null
  );

  return (
    <AppLayout header={<WorkspaceSettingHeader title="Webhook Settings" />}>
      <WorkspaceSettingLayout>
        <div className="w-full overflow-y-auto py-3 pr-4">
          {loader ? (
            <div className="flex h-full w-ful items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              {Object.keys(webhooks).length > 0 ? (
                <WebhookLists workspaceSlug={workspaceSlug} />
              ) : (
                <div className="flex justify-center w-full h-full items-center">
                  <div className="w-auto h-fit">
                    <EmptyWebhooks workspaceSlug={workspaceSlug} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </WorkspaceSettingLayout>
    </AppLayout>
  );
});

export default WebhooksPage;
