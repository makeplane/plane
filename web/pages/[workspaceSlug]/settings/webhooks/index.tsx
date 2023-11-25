import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// layout
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { WebhookLists, EmptyWebhooks } from "components/web-hooks";
// ui
import { Spinner } from "@plane/ui";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { NextPageWithLayout } from "types/app";

const WebhooksPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const {
    webhook: { fetchWebhooks, webhooks, loader },
  } = useMobxStore();

  useSWR(
    workspaceSlug ? `WEBHOOKS_LIST_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWebhooks(workspaceSlug) : null
  );

  return (
    <div className="w-full overflow-y-auto py-3 pr-9">
      {loader ? (
        <div className="flex h-full w-ful items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {Object.keys(webhooks).length > 0 ? (
            <WebhookLists workspaceSlug={workspaceSlug} />
          ) : (
            <div className="py-5 mx-auto">
              <EmptyWebhooks />
            </div>
          )}
        </>
      )}
    </div>
  );
});

WebhooksPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Webhook Settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default WebhooksPage;
