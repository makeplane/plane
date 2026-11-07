/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
// plane imports
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { Skeleton } from "@plane/blocks/skeleton";
import { useTranslation } from "@plane/i18n";
import { AgentConnectionService, WorkspaceAgentProviderService } from "@plane/services";
import type { TAgentProviderEntry } from "@plane/types";
// local imports
import { orderProviderEntries } from "./helpers";
import { AgentProviderCard } from "./provider-card";
import type { TAgentProviderCardActions } from "./provider-card";

const agentProviderService = new WorkspaceAgentProviderService();
const agentConnectionService = new AgentConnectionService();

export const agentProvidersKey = (workspaceSlug: string) => `AGENT_PROVIDERS_${workspaceSlug}`;

type Props = {
  workspaceSlug: string;
};

/** Workspace settings → AI providers: one card per provider. */
export function AgentProvidersRoot({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const { data, error, isLoading, mutate } = useSWR(agentProvidersKey(workspaceSlug), () =>
    agentProviderService.list(workspaceSlug)
  );

  const actions: TAgentProviderCardActions = {
    setApiKey: (provider, scope, apiKey) => agentProviderService.setApiKey(workspaceSlug, provider, scope, apiKey),
    removeCredential: (provider, scope) => agentProviderService.removeCredential(workspaceSlug, provider, scope),
    disconnectAccount: (provider) => agentConnectionService.disconnect(provider, workspaceSlug),
    onEntryChange: (entry) =>
      void mutate(
        (current: TAgentProviderEntry[] | undefined) =>
          current?.map((item) => (item.provider === entry.provider ? entry : item)),
        { revalidate: false }
      ),
    refresh: () => mutate(),
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
