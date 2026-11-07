/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Banner } from "@makeplane/propel/components/banner";
import { Button } from "@makeplane/propel/components/button";
import { AUTH_REQUIRED, describeClose } from "@plane/acp-client";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import type { CloseInfo } from "@plane/acp-client";
import { Spinner } from "@plane/blocks/spinner";
import { useTranslation } from "@plane/i18n";
// hooks
import { useAgentChat } from "@/hooks/store/use-agent-chat";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import type { TAgentChatAction, TAgentChatError } from "@/store/agent-chat.store";
// local imports
import { chatErrorDetail, chatErrorMessage, closeReasonKey, modeName } from "./helpers";

function ConnectingStatus({ reconnecting }: { reconnecting: boolean }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-2 text-caption-md-regular text-tertiary">
      <Spinner height="14px" width="14px" />
      {t(reconnecting ? "agents.status.reconnecting" : "agents.status.connecting")}
    </div>
  );
}

function ClosedBanner({ close, onReconnect }: { close: CloseInfo; onReconnect: () => void }) {
  const { t } = useTranslation();
  const { canReconnect } = describeClose(close.code);
  const action = canReconnect ? (
    <Button variant="secondary" size="sm" stretch="auto" label={t("agents.close.reconnect")} onClick={onReconnect} />
  ) : undefined;
  return (
    <Banner
      placement="inline"
      variant={canReconnect ? "warning" : "danger"}
      title={t("agents.close.title")}
      description={t(closeReasonKey(close))}
      role="alert"
      {...(action ? { actions: action } : {})}
    />
  );
}

type ErrorBannerProps = {
  error: TAgentChatError;
  /** Display name of the refused permission level, for `mode_not_allowed`. */
  modeLabel?: string;
  onRetry?: () => void;
  /** The agent could not sign in: link to where keys and sign-ins are added. */
  onManageProviders?: () => void;
  onDismiss: () => void;
};

function ErrorBanner({ error, modeLabel, onRetry, onManageProviders, onDismiss }: ErrorBannerProps) {
  const { t } = useTranslation();
  const detail = chatErrorDetail(error);
  let action;
  if (onManageProviders) {
    action = (
      <Button
        variant="secondary"
        size="sm"
        stretch="auto"
        label={t("agents.picker.manage_providers")}
        onClick={onManageProviders}
      />
    );
  } else if (onRetry) {
    action = <Button variant="secondary" size="sm" stretch="auto" label={t("agents.errors.retry")} onClick={onRetry} />;
  }
  return (
    <Banner
      placement="inline"
      variant="danger"
      title={chatErrorMessage(t, error, modeLabel)}
      role="alert"
      {...(detail ? { description: detail } : {})}
      {...(action ? { actions: action } : {})}
      dismissLabel={t("agents.errors.dismiss")}
      onDismiss={onDismiss}
    />
  );
}

/** Connection progress, why the chat closed (bridge close codes), and failed actions. */
export const AgentChatStatusBanner = observer(function AgentChatStatusBanner() {
  const { t } = useTranslation();
  const router = useAppRouter();
  const { allowPermissions } = useUserPermissions();
  const { snapshot, error, isConnecting, reconnect, startNewSession, clearError, openChat, workspaceSlug, agentId } =
    useAgentChat();

  // A reconnect resumes the chat; when no session was ever opened, start over.
  const handleReconnect = () => {
    if (snapshot?.sessionId) void reconnect();
    else if (workspaceSlug && agentId) void openChat(workspaceSlug, agentId);
  };

  if (isConnecting) return <ConnectingStatus reconnecting={snapshot?.status === "reconnecting"} />;
  if (snapshot?.status === "closed" && snapshot.close) {
    return <ClosedBanner close={snapshot.close} onReconnect={handleReconnect} />;
  }
  if (!error) return null;

  if (error.kind === "mode_not_allowed") {
    const mode = snapshot?.transcript.modes?.availableModes.find((candidate) => candidate.id === error.modeId);
    return (
      <ErrorBanner
        error={error}
        modeLabel={modeName(t, mode ?? { id: error.modeId, name: error.modeId })}
        onDismiss={clearError}
      />
    );
  }
  const retry: Partial<Record<TAgentChatAction, () => void>> = {
    new_session: () => void startNewSession(),
    connect: handleReconnect,
    reconnect: handleReconnect,
  };
  const onRetry = retry[error.action];
  // Retrying cannot fix a missing credential; admins and members can add one (guests cannot).
  const needsCredential = error.kind === "request" && error.code === AUTH_REQUIRED;
  const canManageProviders = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const onManageProviders =
    needsCredential && canManageProviders && workspaceSlug
      ? () => router.push(`/${workspaceSlug}/settings/ai-providers/`)
      : undefined;
  return (
    <ErrorBanner
      error={error}
      onDismiss={clearError}
      {...(onManageProviders ? { onManageProviders } : onRetry ? { onRetry } : {})}
    />
  );
});
