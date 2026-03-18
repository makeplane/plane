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
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Input } from "@plane/ui";
import { useBitbucketDCIntegration } from "@/plane-web/hooks/store";

type TConnectBitbucketFormProps = {
  handleClose: () => void;
};

export const ConnectBitbucketForm = observer(function ConnectBitbucketForm({
  handleClose,
}: TConnectBitbucketFormProps) {
  const {
    auth: { fetchAppConfigKey, connectWorkspaceConnectionOAuth },
  } = useBitbucketDCIntegration();
  const { t } = useTranslation();

  const [baseUrl, setBaseUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!baseUrl.trim() || !clientId.trim() || !clientSecret.trim()) {
      setToast({
        title: "Missing fields",
        message: "Please enter the Bitbucket base URL, Client ID, and Client Secret.",
        type: TOAST_TYPE.ERROR,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await fetchAppConfigKey({
        baseUrl: baseUrl.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        webhookSecret: webhookSecret.trim() || undefined,
      });
      const authUrl = await connectWorkspaceConnectionOAuth();
      if (authUrl) window.open(authUrl, "_self");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Failed to initiate OAuth connection. Check your credentials and try again.";
      setToast({ title: "Connection failed", message, type: TOAST_TYPE.ERROR });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 p-5">
      <div className="space-y-1">
        <div className="text-heading-sm-medium text-secondary">Connect Bitbucket Data Center</div>
        <div className="text-body-xs-regular text-tertiary">
          Connect your Bitbucket Data Center instance using OAuth 2.0.
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="bb-base-url" className="text-body-xs-medium text-secondary">
            Bitbucket Base URL
          </label>
          <Input
            id="bb-base-url"
            type="url"
            placeholder="http(s)://bitbucket.example.com"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="bb-client-id" className="text-body-xs-medium text-secondary">
            Client ID
          </label>
          <Input
            id="bb-client-id"
            type="text"
            placeholder="Enter the OAuth Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="bb-client-secret" className="text-body-xs-medium text-secondary">
            Client Secret
          </label>
          <Input
            id="bb-client-secret"
            type="password"
            placeholder="Enter the OAuth Client Secret"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="bb-webhook-secret" className="text-body-xs-medium text-secondary">
            Webhook Secret <span className="text-tertiary">(optional)</span>
          </label>
          <Input
            id="bb-webhook-secret"
            type="password"
            placeholder="Enter the Bitbucket webhook secret"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="text-caption-sm-regular text-tertiary space-y-1">
          <p>To set up the Application Link in Bitbucket:</p>
          <ol className="list-decimal pl-4 space-y-0.5">
            <li>
              Go to <span className="text-secondary">Administration → Application links → Create link</span>
            </li>
            <li>
              Select <span className="text-secondary">External application → Incoming</span>
            </li>
            <li>
              Set the Redirect URL to your Plane Silo OAuth callback URL (e.g.{" "}
              <span className="text-secondary">{"<silo-url>/silo/api/oauth/bitbucket-dc/auth/callback"}</span>)
            </li>
            <li>
              Grant <span className="text-secondary">Repository Admin</span> and{" "}
              <span className="text-secondary">Project Admin</span> permissions
            </li>
          </ol>
          <p>Webhook secret is optional. If set, ensure the same secret is configured in your Bitbucket webhook.</p>
        </div>
      </div>

      <div className="flex justify-end items-center gap-2">
        <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        <Button variant="primary" onClick={() => void handleSubmit()} loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? t("common.processing") : "Connect with OAuth"}
        </Button>
      </div>
    </div>
  );
});
