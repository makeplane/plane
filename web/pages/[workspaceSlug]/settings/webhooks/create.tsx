import React from "react";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { WebhookForm } from "components/web-hooks";
// types
import { NextPageWithLayout } from "types/app";

const CreateWebhookPage: NextPageWithLayout = observer(() => {
  const {
    user: { currentWorkspaceRole },
  } = useMobxStore();

  const isAdmin = currentWorkspaceRole === 20;

  if (!isAdmin)
    return (
      <div className="mt-10 flex h-full w-full justify-center p-4">
        <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
      </div>
    );

  return (
    <div className="w-full overflow-y-auto py-8 pl-1 pr-9">
      <WebhookForm />
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
