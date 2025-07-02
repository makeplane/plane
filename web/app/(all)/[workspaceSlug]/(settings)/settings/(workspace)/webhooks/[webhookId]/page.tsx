"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel, WORKSPACE_SETTINGS_TRACKER_EVENTS } from "@plane/constants";
import { IWebhook } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
import { SettingsContentWrapper } from "@/components/settings";
import { DeleteWebhookModal, WebhookDeleteSection, WebhookForm } from "@/components/web-hooks";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useUserPermissions, useWebhook, useWorkspace } from "@/hooks/store";

const WebhookDetailsPage = observer(() => {
  // states
  const [deleteWebhookModal, setDeleteWebhookModal] = useState(false);
  // router
  const { workspaceSlug, webhookId } = useParams();
  // mobx store
  const { currentWebhook, fetchWebhookById, updateWebhook } = useWebhook();
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();

  // TODO: fix this error
  // useEffect(() => {
  //   if (isCreated !== "true") clearSecretKey();
  // }, [clearSecretKey, isCreated]);

  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
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
        captureSuccess({
          eventName: WORKSPACE_SETTINGS_TRACKER_EVENTS.webhook_updated,
          payload: {
            webhook: formData.id,
          },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Webhook updated successfully.",
        });
      })
      .catch((error) => {
        captureError({
          eventName: WORKSPACE_SETTINGS_TRACKER_EVENTS.webhook_updated,
          payload: {
            webhook: formData.id,
          },
          error: error as Error,
        });
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
        <LogoSpinner />
      </div>
    );

  return (
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      <DeleteWebhookModal isOpen={deleteWebhookModal} onClose={() => setDeleteWebhookModal(false)} />
      <div className="w-full space-y-8 overflow-y-auto">
        <div className="">
          <WebhookForm onSubmit={async (data) => await handleUpdateWebhook(data)} data={currentWebhook} />
        </div>
        {currentWebhook && <WebhookDeleteSection openDeleteModal={() => setDeleteWebhookModal(true)} />}
      </div>
    </SettingsContentWrapper>
  );
});

export default WebhookDetailsPage;
