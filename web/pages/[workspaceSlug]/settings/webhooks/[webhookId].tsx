import { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// hooks
import useToast from "hooks/use-toast";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { DeleteWebhookModal, WebhookDeleteSection, WebhookForm } from "components/web-hooks";
// ui
import { Spinner } from "@plane/ui";
// types
import { NextPageWithLayout } from "types/app";
import { IWebhook } from "types";

const WebhookDetailsPage: NextPageWithLayout = observer(() => {
  // states
  const [deleteWebhookModal, setDeleteWebhookModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, webhookId } = router.query;
  // mobx store
  const {
    webhook: { currentWebhook, fetchWebhookById, updateWebhook },
    user: { currentWorkspaceRole },
  } = useMobxStore();
  // toast
  const { setToastAlert } = useToast();

  const isAdmin = currentWorkspaceRole === 20;

  useSWR(
    workspaceSlug && webhookId && isAdmin ? `WEBHOOK_DETAILS_${workspaceSlug}_${webhookId}` : null,
    workspaceSlug && webhookId && isAdmin
      ? () => fetchWebhookById(workspaceSlug.toString(), webhookId.toString())
      : null
  );

  const handleUpdateWebhook = async (formData: IWebhook) => {
    if (!workspaceSlug || !formData || !formData.id) return;
    const payload = {
      url: formData?.url,
      is_active: formData?.is_active,
      project: formData?.project,
      cycle: formData?.cycle,
      module: formData?.module,
      issue: formData?.issue,
      issue_comment: formData?.issue_comment,
    };
    await updateWebhook(workspaceSlug.toString(), formData.id, payload)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Webhook updated successfully.",
        });
      })
      .catch((error) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: error?.error ?? "Something went wrong. Please try again.",
        });
      });
  };

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
        <WebhookForm onSubmit={async (data) => await handleUpdateWebhook(data)} data={currentWebhook} />
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
