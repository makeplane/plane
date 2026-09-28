/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import useSWR from "swr";
import { KeyRound, XCircle } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ServiceAccessTokenService } from "@plane/services";
import type { IServiceAccessToken, IServiceAccessTokenCreate } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import { copyTextToClipboard, renderFormattedDate } from "@plane/utils";
import { PageWrapper } from "@/components/common/page-wrapper";
import type { Route } from "./+types/page";

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

function CreateInstanceTokenModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (token: IServiceAccessToken) => void;
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"read" | "read-write" | "custom">("read");
  const [customScopes, setCustomScopes] = useState<string[]>(READ_SCOPES);
  const [generated, setGenerated] = useState<IServiceAccessToken | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const scopes = useMemo(
    () => (mode === "read" ? READ_SCOPES : mode === "read-write" ? ALL_SCOPES : customScopes),
    [customScopes, mode]
  );

  const close = () => {
    setLabel("");
    setDescription("");
    setMode("read");
    setCustomScopes(READ_SCOPES);
    setGenerated(null);
    onClose();
  };

  const create = async () => {
    if (!label.trim() || !scopes.length) return;
    setSubmitting(true);
    const payload: IServiceAccessTokenCreate = {
      label: label.trim(),
      description: description.trim(),
      expired_at: null,
      scopes,
    };
    try {
      const token = await tokenService.createInstance(payload);
      setGenerated(token);
      onCreated(token);
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not create token",
        message: error?.detail || error?.message || "Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={() => {}} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      {generated ? (
        <div className="space-y-4 p-5">
          <div>
            <h3 className="text-h4-medium text-primary">Instance access token created</h3>
            <p className="mt-1 text-body-xs-regular text-tertiary">
              Copy this secret now. It can access every workspace only within the scopes you selected.
            </p>
          </div>
          <button
            type="button"
            className="font-mono flex w-full items-center justify-between rounded-md border border-subtle px-3 py-2 text-body-xs-regular"
            onClick={() => generated.token && void copyTextToClipboard(generated.token)}
          >
            <span className="truncate">{generated.token}</span>
            <span className="ml-3">Copy</span>
          </button>
          <div className="flex justify-end">
            <Button variant="primary" onClick={close}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 p-5">
          <div>
            <h3 className="text-h4-medium text-primary">Create instance access token</h3>
            <p className="mt-1 text-body-xs-regular text-tertiary">
              For central MCP agents, daily/weekly digests, and instance-wide automation. This is not an instance-admin
              token.
            </p>
          </div>
          <label htmlFor="instance-token-name" className="block space-y-1 text-body-xs-regular text-secondary">
            <span>Token name</span>
            <Input
              id="instance-token-name"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. MCP daily digest"
            />
          </label>
          <label htmlFor="instance-token-description" className="block space-y-1 text-body-xs-regular text-secondary">
            <span>Description (optional)</span>
            <TextArea
              id="instance-token-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What will this token be used for?"
              className="min-h-20"
              rows={3}
            />
          </label>
          <div className="flex gap-2">
            {(
              [
                ["read", "Read only"],
                ["read-write", "Read + write"],
                ["custom", "Custom"],
              ] as const
            ).map(([value, title]) => (
              <Button
                key={value}
                variant={mode === value ? "primary" : "secondary"}
                size="sm"
                onClick={() => setMode(value)}
              >
                {title}
              </Button>
            ))}
          </div>
          {mode === "custom" && (
            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto rounded-md border border-subtle p-3 md:grid-cols-2">
              {ALL_SCOPES.map((scope) => (
                <label key={scope} className="flex items-center gap-2 text-body-xs-regular text-secondary">
                  <input
                    type="checkbox"
                    checked={customScopes.includes(scope)}
                    onChange={() =>
                      setCustomScopes((current) =>
                        current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]
                      )
                    }
                  />
                  <span className="font-mono">{scope}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void create()}
              disabled={submitting || !label.trim() || !scopes.length}
            >
              {submitting ? "Creating…" : "Create token"}
            </Button>
          </div>
        </div>
      )}
    </ModalCore>
  );
}

export default function InstanceAccessTokensPage(_props: Route.ComponentProps) {
  const [open, setOpen] = useState(false);
  const { data: tokens, mutate } = useSWR("INSTANCE_SERVICE_TOKENS", () => tokenService.listInstance());

  const revoke = async (token: IServiceAccessToken) => {
    if (!window.confirm(`Revoke “${token.label}”? This stops every agent using it immediately.`)) return;
    try {
      await tokenService.revokeInstance(token.id);
      await mutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Token revoked", message: "The instance token is no longer valid." });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not revoke token",
        message: error?.detail || error?.message || "Try again.",
      });
    }
  };

  return (
    <PageWrapper
      header={{
        title: "Instance access tokens",
        description:
          "Service identities for MCP and central automation across all workspaces. Access is still restricted by explicit scopes.",
      }}
    >
      <CreateInstanceTokenModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onCreated={(token) => void mutate((current) => [token, ...(current ?? [])], { revalidate: false })}
      />
      <div className="mb-5 flex justify-end">
        <Button variant="primary" onClick={() => setOpen(true)}>
          <KeyRound className="size-4" />
          Create access token
        </Button>
      </div>
      {!tokens ? (
        <div className="py-12 text-body-xs-regular text-tertiary">Loading access tokens…</div>
      ) : tokens.length === 0 ? (
        <div className="rounded-md border border-subtle p-8 text-center">
          <KeyRound className="mx-auto size-6 text-tertiary" />
          <h3 className="mt-3 text-body-sm-medium text-primary">No instance access tokens</h3>
          <p className="mt-1 text-body-xs-regular text-tertiary">
            For digest agents, create a read-only token and keep write scopes disabled.
          </p>
        </div>
      ) : (
        <div>
          {tokens.map((token) => (
            <div key={token.id} className="flex items-start justify-between gap-4 border-b border-subtle py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body-sm-medium text-primary">{token.label}</span>
                  <span className={token.is_active ? "text-success-primary" : "text-tertiary"}>
                    {token.is_active ? "Active" : "Revoked / expired"}
                  </span>
                  <span className="font-mono text-caption-sm-regular text-tertiary">{token.token_prefix}…</span>
                </div>
                {token.description && <p className="mt-1 text-body-xs-regular text-secondary">{token.description}</p>}
                <p className="mt-1 text-caption-sm-regular text-tertiary">
                  {token.scopes.length} scopes ·{" "}
                  {token.last_used ? `Last used ${renderFormattedDate(token.last_used)}` : "Never used"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {token.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="font-mono rounded bg-layer-1 px-1.5 py-0.5 text-caption-sm-regular text-tertiary"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
              {token.is_active && (
                <Button variant="ghost" size="sm" onClick={() => void revoke(token)}>
                  <XCircle className="size-4 text-danger-primary" />
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Access Tokens - God Mode" }];
