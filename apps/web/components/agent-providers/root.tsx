/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
import useSWR, { useSWRConfig } from "swr";
// plane imports
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { Skeleton } from "@plane/blocks/skeleton";
import { setToast } from "@plane/blocks/toast";
import { isAgentAccountProvider } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { AgentConnectionService, WorkspaceAgentProviderService } from "@plane/services";
import type { TAgentProviderEntry } from "@plane/types";
// local imports
import { AGENT_PROVIDER_NAMES, orderProviderEntries } from "./helpers";
import { AgentProviderCard } from "./provider-card";
import type { TAgentProviderCardActions } from "./provider-card";

const agentProviderService = new WorkspaceAgentProviderService();
const agentConnectionService = new AgentConnectionService();

export const agentProvidersKey = (workspaceSlug: string) => `AGENT_PROVIDERS_${workspaceSlug}`;
/** The agent chat's agent list (the widget and the agents page), which shows which agents can sign in. */
const workspaceAgentsKey = (workspaceSlug: string) => `WORKSPACE_AGENTS_${workspaceSlug}`;

type Props = {
  workspaceSlug: string;
};

/** Workspace settings → AI providers: one card per provider. */
export function AgentProvidersRoot({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const { mutate: mutateKey } = useSWRConfig();
  const { data, error, isLoading, mutate } = useSWR(agentProvidersKey(workspaceSlug), () =>
    agentProviderService.list(workspaceSlug)
  );
  // A credential change also changes which chat agents can sign in.
  const refreshAgents = () => void mutateKey(workspaceAgentsKey(workspaceSlug));

  // Once per visit, check that each stored account sign-in is still on the agent runner. One that
  // is gone (revoked, expired) is removed by the bridge, so the card offers to sign in again.
  const checked = useRef(new Set<string>());
  const accountProviders = (data ?? []).flatMap((entry) =>
    isAgentAccountProvider(entry.provider) && entry.personal && entry.personal.method !== "api_key"
      ? [entry.provider]
      : []
  );
  const toCheck = accountProviders.filter((provider) => !checked.current.has(`${workspaceSlug}:${provider}`));
  useEffect(() => {
    if (toCheck.length === 0) return;
    const controller = new AbortController();
    const check = async (provider: (typeof toCheck)[number]) => {
      try {
        const result = await agentConnectionService.account(provider, workspaceSlug, controller.signal);
        if (result.connected) return;
        setToast({
          type: "warning",
          title: t("agents.providers.toasts.sign_in_lost", { vendor: AGENT_PROVIDER_NAMES[provider].vendor }),
        });
        refreshAgents();
        await mutate();
      } catch {
        // The runner may be unreachable; the stored state then stays as it is.
      }
    };
    for (const provider of toCheck) {
      checked.current.add(`${workspaceSlug}:${provider}`);
      void check(provider);
    }
    return () => controller.abort();
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- runs when the set of providers to check changes
  }, [toCheck.join(","), workspaceSlug]);

  const actions: TAgentProviderCardActions = {
    setApiKey: (provider, scope, apiKey) => agentProviderService.setApiKey(workspaceSlug, provider, scope, apiKey),
    removeCredential: (provider, scope) => agentProviderService.removeCredential(workspaceSlug, provider, scope),
    disconnectAccount: (provider) => agentConnectionService.disconnect(provider, workspaceSlug),
    onEntryChange: (entry) => {
      void mutate(
        (current: TAgentProviderEntry[] | undefined) =>
          current?.map((item) => (item.provider === entry.provider ? entry : item)),
        { revalidate: false }
      );
      refreshAgents();
    },
    refresh: async () => {
      refreshAgents();
      return mutate();
    },
  };

  if (isLoading && !data)
    return (
      <Skeleton className="flex flex-col gap-4">
        <Skeleton.Item height="160px" width="100%" />
        <Skeleton.Item height="160px" width="100%" />
        <Skeleton.Item height="160px" width="100%" />
      </Skeleton>
    );

  if (error && !data)
    return (
      <EmptyStateCompact
        title={t("agents.providers.load_failed_title")}
        description={t("agents.providers.load_failed_description")}
        align="start"
        actions={[{ label: t("agents.errors.retry"), variant: "secondary", onClick: () => void mutate() }]}
        rootClassName="rounded-lg border border-subtle bg-surface-1 py-10"
      />
    );

  return (
    <div className="flex flex-col gap-4">
      {orderProviderEntries(data ?? []).map((entry) => (
        <AgentProviderCard key={entry.provider} entry={entry} workspaceSlug={workspaceSlug} actions={actions} />
      ))}
    </div>
  );
}
