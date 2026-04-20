/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
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
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Webhook` : undefined;

  // TODO: fix this error
  // useEffect(() => {
  //   if (isCreated !== "true") clearSecretKey();
  // }, [clearSecretKey, isCreated]);

  useSWR(`WEBHOOK_DETAILS_${workspaceSlug}_${webhookId}`, () => fetchWebhookById(workspaceSlug, webhookId));

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
      // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.error ?? "Something went wrong. Please try again.",
      });
    }
  };

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
