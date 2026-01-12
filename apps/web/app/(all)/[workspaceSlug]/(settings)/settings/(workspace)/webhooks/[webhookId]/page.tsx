import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWebhook } from "@plane/types";
// ui
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { DeleteWebhookModal, WebhookDeleteSection, WebhookForm } from "@/components/web-hooks";
// hooks
import { useWebhook } from "@/hooks/store/use-webhook";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { WebhookDetailsWorkspaceSettingsHeader } from "./header";

function WebhookDetailsPage({ params }: Route.ComponentProps) {
  // states
  const [deleteWebhookModal, setDeleteWebhookModal] = useState(false);
  // router
  const { workspaceSlug, webhookId } = params;
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
    isAdmin ? `WEBHOOK_DETAILS_${workspaceSlug}_${webhookId}` : null,
    isAdmin ? () => fetchWebhookById(workspaceSlug, webhookId) : null
  );

  const handleUpdateWebhook = async (formData: IWebhook) => {
    if (!formData || !formData.id) return;

    const payload = {
      url: formData.url,
      is_active: formData.is_active,
      project: formData.project,
      cycle: formData.cycle,
      module: formData.module,
      issue: formData.issue,
      issue_comment: formData.issue_comment,
    };

    try {
      await updateWebhook(workspaceSlug, formData.id, payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Webhook updated successfully.",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.error ?? "Something went wrong. Please try again.",
      });
    }
  };

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-13 text-tertiary">You are not authorized to access this page.</p>
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
    <SettingsContentWrapper header={<WebhookDetailsWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <DeleteWebhookModal isOpen={deleteWebhookModal} onClose={() => setDeleteWebhookModal(false)} />
      <div className="w-full space-y-8 overflow-y-auto">
        <div>
          <WebhookForm onSubmit={handleUpdateWebhook} data={currentWebhook} />
        </div>
        {currentWebhook && <WebhookDeleteSection openDeleteModal={() => setDeleteWebhookModal(true)} />}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(WebhookDetailsPage);
