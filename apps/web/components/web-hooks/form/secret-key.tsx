/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { CopyOutline, HideOutline, RefreshOutline, ShowOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { setToast } from "@plane/blocks/toast";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import type { IWebhook } from "@plane/types";
// ui
import { csvDownload, copyTextToClipboard } from "@plane/utils";
// hooks
import { useWebhook } from "@/hooks/store/use-webhook";
import { useWorkspace } from "@/hooks/store/use-workspace";
// types
import { usePlatformOS } from "@/hooks/use-platform-os";
// utils
import { getCurrentHookAsCSV } from "../utils";
// hooks

type Props = {
  data: Partial<IWebhook>;
};

export const WebhookSecretKey = observer(function WebhookSecretKey(props: Props) {
  const { data } = props;
  // states
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [shouldShowKey, setShouldShowKey] = useState(false);
  // router
  const { workspaceSlug, webhookId } = useParams();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { currentWebhook, regenerateSecretKey, webhookSecretKey } = useWebhook();
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  const handleCopySecretKey = () => {
    if (!webhookSecretKey) return;

    copyTextToClipboard(webhookSecretKey)
      .then(() =>
        setToast({
          type: "success",
          title: `${t("success")}`,
          message: t("workspace_settings.settings.webhooks.toasts.secret_key_copied.message"),
        })
      )
      .catch(() =>
        setToast({
          type: "error",
          title: `${t("error")}!`,
          message: t("workspace_settings.settings.webhooks.toasts.secret_key_not_copied.message"),
        })
      );
  };

  const handleRegenerateSecretKey = () => {
    if (!workspaceSlug || !data.id) return;

    setIsRegenerating(true);

    regenerateSecretKey(workspaceSlug.toString(), data.id)
      .then(() => {
        setToast({
          type: "success",
          title: `${t("success")}`,
          message: "New key regenerated successfully.",
        });

        if (currentWebhook && webhookSecretKey) {
          const csvData = getCurrentHookAsCSV(currentWorkspace, currentWebhook, webhookSecretKey);
          csvDownload(csvData, `webhook-secret-key-${Date.now()}`);
        }
      })
      .catch((err) =>
        setToast({
          type: "error",
          title: `${t("error")}!`,
          message: err?.error ?? t("something_went_wrong_please_try_again"),
        })
      )
      .finally(() => setIsRegenerating(false));
  };

  const toggleShowKey = () => setShouldShowKey((prevState) => !prevState);

  const SECRET_KEY_OPTIONS = [
    { label: "View secret key", Icon: shouldShowKey ? HideOutline : ShowOutline, onClick: toggleShowKey, key: "eye" },
    { label: "Copy secret key", Icon: CopyOutline, onClick: handleCopySecretKey, key: "copy" },
  ];

  return (
    <>
      {(data || webhookSecretKey) && (
        <div className="space-y-2">
          {webhookId && (
            <div className="text-body-sm-medium">{t("workspace_settings.settings.webhooks.secret_key.title")}</div>
          )}
          <div className="text-caption-sm-regular text-placeholder">
            {t("workspace_settings.settings.webhooks.secret_key.message")}
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="min-w-0 flex-1 md:max-w-lg">
              <InputGroup size="md">
                <Input
                  size="md"
                  readOnly
                  type={shouldShowKey ? "text" : "password"}
                  value={webhookSecretKey ?? ""}
                  // without a key in hand (an existing webhook) only the mask is shown
                  placeholder={webhookSecretKey ? undefined : "•".repeat(30)}
                  aria-label={t("workspace_settings.settings.webhooks.secret_key.title")}
                />
                {webhookSecretKey &&
                  SECRET_KEY_OPTIONS.map((option) => (
                    <IconButton
                      key={option.key}
                      type="button"
                      variant="ghost"
                      size="xs"
                      aria-label={option.label}
                      aria-pressed={option.key === "eye" ? shouldShowKey : undefined}
                      showTooltip={!isMobile}
                      onClick={option.onClick}
                      icon={<Icon icon={option.Icon} />}
                    />
                  ))}
              </InputGroup>
            </div>
            {data && (
              <div>
                <Button
                  variant="secondary"
                  size="md"
                  stretch="auto"
                  label={isRegenerating ? `${t("re_generating")}...` : t("re_generate_key")}
                  onClick={handleRegenerateSecretKey}
                  loading={isRegenerating}
                  icon={<Icon icon={RefreshOutline} />}
                  iconPosition="start"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});
