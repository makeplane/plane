import React from "react";
import type { NextPage } from "next";
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingHeader } from "components/headers";
import { WorkspaceSettingLayout } from "layouts/setting-layout";
import { EmptyWebhooks, WebhookLists, WebhookDetails } from "components/web-hooks";

const Webhooks: NextPage = () => {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Webhook Settings" />}>
      <WorkspaceSettingLayout>
        <section className="pr-9 py-8 w-full overflow-y-auto">
          {/* <EmptyWebhooks /> */}
          {/* <WebhookLists /> */}
          <WebhookDetails />
        </section>
      </WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default Webhooks;
