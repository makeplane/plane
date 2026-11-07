/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  AGENT_PROVIDERS,
  AGENT_PROVIDER_ACCOUNT_METHODS,
  AGENT_PROVIDER_API_KEY_MAX_LENGTH,
  AGENT_PROVIDER_API_KEY_MIN_LENGTH,
} from "@plane/constants";
import { AgentConnectionError } from "@plane/services";
import type {
  TAgentCredentialMethod,
  TAgentProvider,
  TAgentProviderEntry,
  TAgentProviderPersonalCredential,
  TAgentProviderWorkspaceCredential,
} from "@plane/types";

/** Brand names, never translated. */
export const AGENT_PROVIDER_NAMES: Record<TAgentProvider, { vendor: string; product: string }> = {
  anthropic: { vendor: "Anthropic", product: "Claude" },
  openai: { vendor: "OpenAI", product: "Codex" },
  google: { vendor: "Google", product: "Gemini" },
};

export type TAccountMethod = Exclude<TAgentCredentialMethod, "api_key">;

/** What a credential slot holds, as the card shows it. */
export type TCredentialState =
  | { kind: "none" }
  | { kind: "api_key"; hint: string }
  | { kind: "account"; method: TAccountMethod; email: string };

export type TPersonalAction = "add_api_key" | "sign_in" | "replace" | "remove" | "disconnect";
export type TWorkspaceAction = "add" | "replace" | "remove";

export type TProviderCardState = {
  provider: TAgentProvider;
  personal: TCredentialState;
  workspace: TCredentialState;
  /** The account sign-in this provider offers, if any. */
  accountMethod: TAccountMethod | undefined;
  personalActions: TPersonalAction[];
  /** Empty for members: they see the workspace key read-only. */
  workspaceActions: TWorkspaceAction[];
  canManageWorkspace: boolean;
  /** Shown when neither a personal nor a workspace credential is set. */
  fallback: "instance" | "missing" | null;
  /** Claude is API key only; the card says why. */
  showSubscriptionNote: boolean;
};

export function credentialState(
  credential: TAgentProviderPersonalCredential | TAgentProviderWorkspaceCredential | null | undefined
): TCredentialState {
  if (!credential) return { kind: "none" };
  if (credential.method === "api_key") return { kind: "api_key", hint: credential.secret_hint ?? "" };
  const email = "account_label" in credential ? (credential.account_label ?? "") : "";
  return { kind: "account", method: credential.method, email };
}

export function deriveProviderCard(entry: TAgentProviderEntry): TProviderCardState {
  const personal = credentialState(entry.personal);
  const workspace = credentialState(entry.workspace);
  const accountMethod = AGENT_PROVIDER_ACCOUNT_METHODS[entry.provider] as TAccountMethod | undefined;

  let personalActions: TPersonalAction[];
  if (personal.kind === "none") personalActions = accountMethod ? ["add_api_key", "sign_in"] : ["add_api_key"];
  else if (personal.kind === "api_key") personalActions = ["replace", "remove"];
  else personalActions = ["disconnect"];

  let workspaceActions: TWorkspaceAction[] = [];
  if (entry.can_manage_workspace) workspaceActions = workspace.kind === "none" ? ["add"] : ["replace", "remove"];

  let fallback: TProviderCardState["fallback"] = null;
  if (personal.kind === "none" && workspace.kind === "none")
    fallback = entry.instance_configured ? "instance" : "missing";

  return {
    provider: entry.provider,
    personal,
    workspace,
    accountMethod,
    personalActions,
    workspaceActions,
    canManageWorkspace: entry.can_manage_workspace,
    fallback,
    showSubscriptionNote: entry.provider === "anthropic",
  };
}

/** The providers this build knows, in display order (unknown ones from a newer API are skipped). */
export function orderProviderEntries(entries: TAgentProviderEntry[]): TAgentProviderEntry[] {
  return AGENT_PROVIDERS.flatMap((provider) => entries.filter((entry) => entry.provider === provider).slice(0, 1));
}

/** The same rules the API enforces: 8–512 characters, no whitespace. Returns the key to send, or null. */
export function normalizeApiKey(value: string): string | null {
  const key = value.trim();
  if (key.length < AGENT_PROVIDER_API_KEY_MIN_LENGTH || key.length > AGENT_PROVIDER_API_KEY_MAX_LENGTH) return null;
  if (/\s/.test(key)) return null;
  return key;
}

/** The first DRF error message in an API error body, if any. */
export function apiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  for (const value of Object.values(error as Record<string, unknown>)) {
    if (typeof value === "string" && value) return value;
    if (Array.isArray(value)) {
      const message = value.find((item): item is string => typeof item === "string" && item !== "");
      if (message) return message;
    }
  }
  return undefined;
}

export type TSignInErrorReason = "failed" | "expired" | "unreachable" | "rate_limited" | "signed_out";

/** Why a bridge `connections` call failed, for the message the dialog shows. */
export function signInErrorReason(error: unknown): TSignInErrorReason {
  if (!(error instanceof AgentConnectionError)) return "failed";
  if (error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504) return "unreachable";
  if (error.status === 404) return "expired";
  if (error.status === 429) return "rate_limited";
  if (error.status === 401) return "signed_out";
  return "failed";
}

/** A transient failure worth retrying while polling (the next poll may succeed). */
export function isTransientSignInError(error: unknown): boolean {
  return signInErrorReason(error) === "unreachable";
}

/** The sign-in link from the bridge, only when it is an http(s) URL (never `javascript:` and the like). */
export function safeExternalUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
