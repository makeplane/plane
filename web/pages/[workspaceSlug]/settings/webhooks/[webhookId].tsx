import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import useSWR from "swr";
import { IWebhook } from "@plane/types";
// hooks
import { Spinner, TOAST_TYPE, setToast } from "@plane/ui";

import { PageHead } from "@/components/core";
import { WorkspaceSettingHeader } from "@/components/headers";
import { DeleteWebhookModal, WebhookDeleteSection, WebhookForm } from "@/components/web-hooks";
import { useUser, useWebhook, useWorkspace } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
import { WorkspaceSettingLayout } from "@/layouts/settings-layout";
// components
// ui
// types
import { NextPageWithLayout } from "@/lib/types";

const WebhookDetailsPage: NextPageWithLayout = observer(() => {
  // states
  const [deleteWebhookModal, setDeleteWebhookModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, webhookId } = router.query;
  // mobx store
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { currentWebhook, fetchWebhookById, updateWebhook } = useWebhook();
  const { currentWorkspace } = useWorkspace();

  // TODO: fix this error
  // useEffect(() => {
  //   if (isCreated !== "true") clearSecretKey();
  // }, [clearSecretKey, isCreated]);

  const isAdmin = currentWorkspaceRole === 20;
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Webhook` : undefined;

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
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Webhook updated successfully.",
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? "Something went wrong. Please try again.",
        });
      });
  };

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  if (!currentWebhook)
    return (
      <div className="grid h-full w-full place-items-center p-4">
        <Spinner />
      </div>
    );

  return (
    <>
      <PageHead title={pageTitle} />
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
