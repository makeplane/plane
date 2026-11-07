/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { Chatgpt, Claude } from "@makeplane/propel/icons";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { TAgentProviderCredentialScope } from "@plane/services";
import type { TAgentAccountProvider, TAgentConnectionAccount, TAgentProvider, TAgentProviderEntry } from "@plane/types";
// assets
import googleLogo from "@/app/assets/logos/google-logo.svg?url";
// local imports
import { AgentProviderApiKeyDialog } from "./api-key-dialog";
import { AGENT_PROVIDER_NAMES, apiErrorMessage, deriveProviderCard } from "./helpers";
import type { TCredentialState } from "./helpers";
import { AgentProviderSignInDialog } from "./sign-in-dialog";

export type TAgentProviderCardActions = {
  setApiKey: (
    provider: TAgentProvider,
    scope: TAgentProviderCredentialScope,
    apiKey: string
  ) => Promise<TAgentProviderEntry>;
  removeCredential: (provider: TAgentProvider, scope: TAgentProviderCredentialScope) => Promise<void>;
  /** Signs the account out on the runner and forgets it (account sign-ins only). */
  disconnectAccount: (provider: TAgentAccountProvider) => Promise<void>;
  /** The entry changed on the server: replace it in the list. */
  onEntryChange: (entry: TAgentProviderEntry) => void;
  /** Something changed that only a refetch shows (removal, sign-in, sign-out). */
  refresh: () => Promise<unknown>;
};

type Props = {
  entry: TAgentProviderEntry;
  workspaceSlug: string;
  actions: TAgentProviderCardActions;
};

type TDialog =
  | { kind: "none" }
  | { kind: "api_key"; scope: TAgentProviderCredentialScope; replace: boolean }
  | { kind: "remove"; scope: TAgentProviderCredentialScope }
  | { kind: "disconnect"; email: string }
  | { kind: "sign_in"; provider: TAgentAccountProvider };

function ProviderIcon({ provider }: { provider: TAgentProvider }) {
  if (provider === "anthropic") return <Claude className="size-5" />;
  if (provider === "openai") return <Chatgpt className="size-5" />;
  return <img src={googleLogo} alt="" className="size-5" />;
}

function CredentialLine({ state, emptyKey }: { state: TCredentialState; emptyKey: string }) {
  const { t } = useTranslation();
  if (state.kind === "api_key")
    return (
      <span className="text-body-xs-regular text-secondary">
        {t("agents.providers.state.api_key", { hint: state.hint })}
      </span>
    );
  if (state.kind === "account")
    return (
      <span className="text-body-xs-regular text-secondary">
        {state.email
          ? t("agents.providers.state.signed_in", { email: state.email })
          : t("agents.providers.state.signed_in_unknown")}
      </span>
    );
  return <span className="text-body-xs-regular text-tertiary">{t(emptyKey)}</span>;
}

/** One provider: the member's own credential, the workspace key, and which one chats fall back to. */
export function AgentProviderCard({ entry, workspaceSlug, actions }: Props) {
  const { t } = useTranslation();
  const [dialog, setDialog] = useState<TDialog>({ kind: "none" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const card = deriveProviderCard(entry);
  const { vendor, product } = AGENT_PROVIDER_NAMES[entry.provider];
  const accountProvider = card.accountMethod ? (entry.provider as TAgentAccountProvider) : undefined;
  const close = () => setDialog({ kind: "none" });

  const handleRemove = async (scope: TAgentProviderCredentialScope) => {
    setIsSubmitting(true);
    try {
      await actions.removeCredential(entry.provider, scope);
      setToast({ type: "success", title: t("agents.providers.toasts.key_removed") });
      close();
      await actions.refresh();
    } catch (error) {
      setToast({
        type: "error",
        title: t("agents.providers.toasts.error_title"),
        message: apiErrorMessage(error) ?? t("agents.providers.toasts.key_remove_failed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!accountProvider) return;
    setIsSubmitting(true);
    try {
      await actions.disconnectAccount(accountProvider);
      setToast({ type: "success", title: t("agents.providers.toasts.disconnected") });
      close();
      await actions.refresh();
    } catch {
      setToast({
        type: "error",
        title: t("agents.providers.toasts.error_title"),
        message: t("agents.providers.toasts.disconnect_failed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnected = (account: TAgentConnectionAccount | undefined) => {
    close();
    setToast({
      type: "success",
      title: account?.email
        ? t("agents.providers.toasts.connected", { email: account.email })
        : t("agents.providers.toasts.connected_unknown"),
    });
    void actions.refresh();
  };

  const personalButtons = card.personalActions.map((action) => {
    const common = { size: "sm", stretch: "auto" } as const;
    switch (action) {
      case "add_api_key":
        return (
          <Button
            key={action}
            {...common}
            variant="secondary"
            label={t("agents.providers.actions.add_api_key")}
            onClick={() => setDialog({ kind: "api_key", scope: "personal", replace: false })}
          />
        );
      case "sign_in":
        return accountProvider ? (
          <Button
            key={action}
            {...common}
            variant="secondary"
            label={t(`agents.providers.actions.sign_in_${accountProvider}`)}
            onClick={() => setDialog({ kind: "sign_in", provider: accountProvider })}
          />
        ) : null;
      case "replace":
        return (
          <Button
            key={action}
            {...common}
            variant="secondary"
            label={t("agents.providers.actions.replace")}
            aria-label={`${t("agents.providers.actions.replace")}: ${t("agents.providers.personal.title")}`}
            onClick={() => setDialog({ kind: "api_key", scope: "personal", replace: true })}
          />
        );
      case "remove":
        return (
          <Button
            key={action}
            {...common}
            variant="ghost"
            label={t("agents.providers.actions.remove")}
            aria-label={`${t("agents.providers.actions.remove")}: ${t("agents.providers.personal.title")}`}
            onClick={() => setDialog({ kind: "remove", scope: "personal" })}
          />
        );
      case "disconnect":
        return (
          <Button
            key={action}
            {...common}
            variant="secondary"
            label={t("agents.providers.actions.disconnect")}
            onClick={() =>
              setDialog({ kind: "disconnect", email: card.personal.kind === "account" ? card.personal.email : "" })
            }
          />
        );
      default:
        return null;
    }
  });

  const workspaceButtons = card.workspaceActions.map((action) => {
    const common = { size: "sm", stretch: "auto" } as const;
    if (action === "add")
      return (
        <Button
          key={action}
          {...common}
          variant="secondary"
          label={t("agents.providers.actions.add_workspace_key")}
          onClick={() => setDialog({ kind: "api_key", scope: "workspace", replace: false })}
        />
      );
    if (action === "replace")
      return (
        <Button
          key={action}
          {...common}
          variant="secondary"
          label={t("agents.providers.actions.replace")}
          aria-label={`${t("agents.providers.actions.replace")}: ${t("agents.providers.workspace.title")}`}
          onClick={() => setDialog({ kind: "api_key", scope: "workspace", replace: true })}
        />
      );
    return (
      <Button
        key={action}
        {...common}
        variant="ghost"
        label={t("agents.providers.actions.remove")}
        aria-label={`${t("agents.providers.actions.remove")}: ${t("agents.providers.workspace.title")}`}
        onClick={() => setDialog({ kind: "remove", scope: "workspace" })}
      />
    );
  });

  const title = `${vendor} · ${product}`;

  return (
    <section aria-label={title} className="flex flex-col rounded-lg border border-subtle bg-surface-1">
      <header className="flex items-start gap-3 px-4 py-3">
        <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-md bg-layer-2">
          <ProviderIcon provider={entry.provider} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h4 className="text-body-sm-medium text-primary">{title}</h4>
          {card.showSubscriptionNote && (
            <p className="text-caption-md-regular text-tertiary">{t("agents.providers.claude_note")}</p>
          )}
        </div>
      </header>

      <div className="flex flex-col divide-y divide-subtle border-t border-subtle">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-body-xs-medium text-primary">{t("agents.providers.personal.title")}</span>
            <CredentialLine state={card.personal} emptyKey="agents.providers.state.none" />
          </div>
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{personalButtons}</div>
        </div>

        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-body-xs-medium text-primary">{t("agents.providers.workspace.title")}</span>
            <CredentialLine state={card.workspace} emptyKey="agents.providers.state.none" />
            {!card.canManageWorkspace && (
              <span className="text-caption-md-regular text-tertiary">
                {t("agents.providers.workspace.admins_only")}
              </span>
            )}
          </div>
          {workspaceButtons.length > 0 && (
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{workspaceButtons}</div>
          )}
        </div>

        {card.fallback && (
          <p
            className={
              card.fallback === "missing"
                ? "px-4 py-3 text-caption-md-regular text-warning-primary"
                : "px-4 py-3 text-caption-md-regular text-tertiary"
            }
          >
            {t(`agents.providers.fallback.${card.fallback}`)}
          </p>
        )}
      </div>

      {dialog.kind === "api_key" && (
        <AgentProviderApiKeyDialog
          provider={entry.provider}
          scope={dialog.scope}
          replace={dialog.replace}
          onSubmit={(apiKey) => actions.setApiKey(entry.provider, dialog.scope, apiKey)}
          onClose={close}
          onSaved={(updated) => {
            close();
            actions.onEntryChange(updated);
          }}
        />
      )}

      {dialog.kind === "sign_in" && (
        <AgentProviderSignInDialog
          provider={dialog.provider}
          workspaceSlug={workspaceSlug}
          onClose={close}
          onConnected={handleConnected}
        />
      )}

      <ConfirmDialog
        isOpen={dialog.kind === "remove"}
        title={t(
          dialog.kind === "remove" && dialog.scope === "workspace"
            ? "agents.providers.remove_dialog.workspace.title"
            : "agents.providers.remove_dialog.personal.title"
        )}
        content={t(
          dialog.kind === "remove" && dialog.scope === "workspace"
            ? "agents.providers.remove_dialog.workspace.content"
            : "agents.providers.remove_dialog.personal.content",
          { provider: vendor }
        )}
        handleClose={() => {
          if (!isSubmitting) close();
        }}
        handleSubmit={() => (dialog.kind === "remove" ? handleRemove(dialog.scope) : undefined)}
        isSubmitting={isSubmitting}
        primaryButtonText={{
          default: t("agents.providers.remove_dialog.confirm"),
          loading: t("agents.providers.remove_dialog.removing"),
        }}
        secondaryButtonText={t("agents.providers.cancel")}
      />

      <ConfirmDialog
        isOpen={dialog.kind === "disconnect"}
        title={t("agents.providers.disconnect_dialog.title")}
        content={
          dialog.kind === "disconnect" && dialog.email
            ? t("agents.providers.disconnect_dialog.content", { email: dialog.email })
            : t("agents.providers.disconnect_dialog.content_unknown")
        }
        handleClose={() => {
          if (!isSubmitting) close();
        }}
        handleSubmit={handleDisconnect}
        isSubmitting={isSubmitting}
        primaryButtonText={{
          default: t("agents.providers.disconnect_dialog.confirm"),
          loading: t("agents.providers.disconnect_dialog.disconnecting"),
        }}
        secondaryButtonText={t("agents.providers.cancel")}
      />
    </section>
  );
}
