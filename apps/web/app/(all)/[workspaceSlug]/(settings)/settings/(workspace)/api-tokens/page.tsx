/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { KeyRound, XCircle } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ServiceAccessTokenService } from "@plane/services";
import type { IServiceAccessToken, IServiceAccessTokenCreate } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import { copyTextToClipboard, renderFormattedDate, renderFormattedTime } from "@plane/utils";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import type { Route } from "./+types/page";
import { ApiTokensWorkspaceSettingsHeader } from "./header";

const tokenService = new ServiceAccessTokenService();

const READ_SCOPES = [
  "workspaces:read",
  "projects:read",
  "work_items:read",
  "cycles:read",
  "modules:read",
  "states:read",
  "labels:read",
  "workspaces.members:read",
  "wiki.pages:read",
];

const WRITE_SCOPES = [
  "projects:write",
  "work_items:write",
  "cycles:write",
  "modules:write",
  "states:write",
  "labels:write",
  "wiki.pages:write",
];

const ALL_SCOPES = [...READ_SCOPES, ...WRITE_SCOPES];

type AccessPreset = "read" | "read-write" | "custom";

function TokenListItem({
  token,
  onRevoke,
}: {
  token: IServiceAccessToken;
  onRevoke: (token: IServiceAccessToken) => Promise<void>;
}) {
  return (
    <div className="group flex items-start justify-between gap-4 border-b border-subtle py-4">
      <div className="min-w-0 grow">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="truncate text-body-sm-medium text-primary">{token.label}</h4>
          <span
            className={
              token.is_active
                ? "rounded-xs bg-success-subtle px-2 py-0.5 text-caption-sm-medium text-success-primary"
                : "rounded-xs bg-layer-1 px-2 py-0.5 text-caption-sm-medium text-placeholder"
            }
          >
            {token.is_active ? "Active" : "Revoked / expired"}
          </span>
          <span className="rounded-xs bg-layer-1 px-2 py-0.5 font-mono text-caption-sm-regular text-tertiary">
            {token.token_prefix}…
          </span>
        </div>
        {token.description && <p className="mt-1 text-body-xs-regular text-secondary">{token.description}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption-sm-regular text-tertiary">
          <span>{token.scopes.length} scopes</span>
          <span>
            {token.expired_at
              ? `Expires ${renderFormattedDate(token.expired_at)} ${renderFormattedTime(token.expired_at)}`
              : "Never expires"}
          </span>
          <span>{token.last_used ? `Last used ${renderFormattedDate(token.last_used)}` : "Never used"}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {token.scopes.map((scope) => (
            <span key={scope} className="rounded bg-layer-1 px-1.5 py-0.5 font-mono text-caption-sm-regular text-tertiary">
              {scope}
            </span>
          ))}
        </div>
      </div>
      {token.is_active && (
        <Button variant="ghost" size="sm" onClick={() => void onRevoke(token)}>
          <XCircle className="size-4 text-danger-primary" />
          Revoke
        </Button>
      )}
    </div>
  );
}

function CreateServiceTokenModal({
  isOpen,
  onClose,
  workspaceSlug,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  onCreated: (token: IServiceAccessToken) => void;
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [preset, setPreset] = useState<AccessPreset>("read");
  const [customScopes, setCustomScopes] = useState<string[]>(READ_SCOPES);
  const [generatedToken, setGeneratedToken] = useState<IServiceAccessToken | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scopes = useMemo(() => {
    if (preset === "read") return READ_SCOPES;
    if (preset === "read-write") return ALL_SCOPES;
    return customScopes;
  }, [customScopes, preset]);

  const resetAndClose = () => {
    setLabel("");
    setDescription("");
    setExpiresAt("");
    setPreset("read");
    setCustomScopes(READ_SCOPES);
    setGeneratedToken(null);
    onClose();
  };

  const submit = async () => {
    if (!label.trim() || scopes.length === 0) return;
    setIsSubmitting(true);
    const payload: IServiceAccessTokenCreate = {
      label: label.trim(),
      description: description.trim(),
      expired_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      scopes,
    };
    try {
      const token = await tokenService.createWorkspace(workspaceSlug, payload);
      setGeneratedToken(token);
      onCreated(token);
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not create access token",
        message: error?.detail || error?.message || "Check the token settings and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleScope = (scope: string) => {
    setCustomScopes((current) =>
      current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]
    );
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={() => {}} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      {generatedToken ? (
        <div className="space-y-4 p-5">
          <div>
            <h3 className="text-h4-medium text-primary">Access token created</h3>
            <p className="mt-1 text-body-xs-regular text-tertiary">
              Copy this secret now. Plane stores only its hash and cannot show it again.
            </p>
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md border border-subtle px-3 py-2 font-mono text-body-xs-regular"
            onClick={() => {
              if (!generatedToken.token) return;
              void copyTextToClipboard(generatedToken.token).then(() =>
                setToast({ type: TOAST_TYPE.SUCCESS, title: "Copied", message: "Access token copied." })
              );
            }}
          >
            <span className="truncate">{generatedToken.token}</span>
            <span className="ml-3 text-secondary">Copy</span>
          </button>
          <div className="flex justify-end">
            <Button variant="primary" onClick={resetAndClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 p-5">
          <div>
            <h3 className="text-h4-medium text-primary">Create workspace access token</h3>
            <p className="mt-1 text-body-xs-regular text-tertiary">
              This token acts as a service principal for this workspace, independent of your personal membership.
            </p>
          </div>
          <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Token name" />
          <TextArea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            className="min-h-20"
          />
          <label className="block space-y-1 text-body-xs-regular text-secondary">
            <span>Expiration (optional)</span>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="h-9 w-full rounded-md border border-subtle bg-surface-1 px-3 text-body-xs-regular text-primary"
            />
          </label>
          <div className="space-y-2">
            <div className="text-body-xs-medium text-primary">Access</div>
            <div className="flex flex-wrap gap-2">
              {([
                ["read", "Read only"],
                ["read-write", "Read + write"],
                ["custom", "Custom"],
              ] as const).map(([value, title]) => (
                <Button
                  key={value}
                  type="button"
                  variant={preset === value ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setPreset(value)}
                >
                  {title}
                </Button>
              ))}
            </div>
          </div>
          {preset === "custom" && (
            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto rounded-md border border-subtle p-3 md:grid-cols-2">
              {ALL_SCOPES.map((scope) => (
                <label key={scope} className="flex cursor-pointer items-center gap-2 text-body-xs-regular text-secondary">
                  <input
                    type="checkbox"
                    checked={customScopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                  />
                  <span className="font-mono">{scope}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={resetAndClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void submit()} disabled={isSubmitting || !label.trim() || !scopes.length}>
              {isSubmitting ? "Creating…" : "Create token"}
            </Button>
          </div>
        </div>
      )}
    </ModalCore>
  );
}

function WorkspaceServiceTokensPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const key = `WORKSPACE_SERVICE_TOKENS_${workspaceSlug}`;
  const { data: tokens, mutate } = useSWR(key, () => tokenService.listWorkspace(workspaceSlug));

  const revoke = async (token: IServiceAccessToken) => {
    if (!window.confirm(`Revoke “${token.label}”? Any agent using it will stop working immediately.`)) return;
    try {
      await tokenService.revokeWorkspace(workspaceSlug, token.id);
      await mutate((current) => current?.map((item) => (item.id === token.id ? { ...item, is_active: false } : item)), {
        revalidate: true,
      });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Token revoked", message: "The access token is no longer valid." });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not revoke token",
        message: error?.detail || error?.message || "Try again.",
      });
    }
  };

  return (
    <SettingsContentWrapper header={<ApiTokensWorkspaceSettingsHeader />}>
      <PageHead title={t("workspace_settings.settings.api_tokens.title")} />
      <CreateServiceTokenModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        workspaceSlug={workspaceSlug}
        onCreated={(token) => void mutate((current) => [token, ...(current ?? [])], { revalidate: false })}
      />
      <SettingsHeading
        title={t("workspace_settings.settings.api_tokens.heading")}
        description="Service identities for MCP, AI agents, and workspace automation. These are not personal access tokens."
        control={
          <Button variant="primary" size="lg" onClick={() => setIsCreateOpen(true)}>
            <KeyRound className="size-4" />
            {t("workspace_settings.settings.api_tokens.add_token")}
          </Button>
        }
      />
      <div className="mt-7">
        {!tokens ? (
          <div className="py-12 text-body-xs-regular text-tertiary">Loading access tokens…</div>
        ) : tokens.length === 0 ? (
          <div className="rounded-md border border-subtle p-8 text-center">
            <KeyRound className="mx-auto size-6 text-tertiary" />
            <h4 className="mt-3 text-body-sm-medium text-primary">No workspace access tokens</h4>
            <p className="mt-1 text-body-xs-regular text-tertiary">
              Create a read-only token for MCP digests or choose explicit write scopes for automation.
            </p>
          </div>
        ) : (
          tokens.map((token) => <TokenListItem key={token.id} token={token} onRevoke={revoke} />)
        )}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(WorkspaceServiceTokensPage);
