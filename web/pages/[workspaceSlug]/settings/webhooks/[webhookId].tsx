import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { DeleteWebhookModal, WebhookDeleteSection, WebhookForm } from "components/web-hooks";
// ui
import { Spinner } from "@plane/ui";
// types
import { NextPageWithLayout } from "types/app";

const WebhookDetailsPage: NextPageWithLayout = observer(() => {
  // states
  const [deleteWebhookModal, setDeleteWebhookModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, webhookId, isCreated } = router.query;
  // mobx store
  const {
    webhook: { currentWebhook, clearSecretKey, fetchWebhookById },
    user: { currentWorkspaceRole },
  } = useMobxStore();

  useEffect(() => {
    if (isCreated !== "true") clearSecretKey();
  }, [clearSecretKey, isCreated]);

  const isAdmin = currentWorkspaceRole === 20;

  useSWR(
    workspaceSlug && webhookId && isAdmin ? `WEBHOOK_DETAILS_${workspaceSlug}_${webhookId}` : null,
    workspaceSlug && webhookId && isAdmin
      ? () => fetchWebhookById(workspaceSlug.toString(), webhookId.toString())
      : null
  );

  if (!isAdmin)
    return (
      <div className="mt-10 flex h-full w-full justify-center p-4">
        <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
      </div>
    );

  if (!currentWebhook)
    return (
      <div className="grid h-full w-full place-items-center p-4">
        <Spinner />
      </div>
    );

  return (
    <>
      <DeleteWebhookModal isOpen={deleteWebhookModal} onClose={() => setDeleteWebhookModal(false)} />
      <div className="w-full space-y-8 overflow-y-auto py-8 pr-9">
        <WebhookForm data={currentWebhook} />
        {currentWebhook && <WebhookDeleteSection openDeleteModal={() => setDeleteWebhookModal(true)} />}
      </div>
    </>
  );
});

WebhookDetailsPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Webhook settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default WebhookDetailsPage;
