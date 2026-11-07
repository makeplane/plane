/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { Spinner } from "@plane/blocks/spinner";
import { useTranslation } from "@plane/i18n";
// hooks
import { useAgentChat } from "@/hooks/store/use-agent-chat";
// local imports
import { AgentChatComposer } from "./composer";
import { AgentChatStatusBanner } from "./connection-banner";
import { recallAgent } from "./helpers";
import { AgentPermissionLevelSelect } from "./permission-level-select";
import { PlanChecklist } from "./plan-checklist";
import { AgentSessionsList } from "./sessions-list";
import { TranscriptView } from "./transcript/transcript-view";
import { UsageMeter } from "./usage-meter";

/** The open chat: status, transcript, composer, and the plan / sessions / usage side panel. */
const AgentChatLayout = observer(function AgentChatLayout() {
  const { t } = useTranslation();
  const { snapshot, activeAgent, canPrompt, supportsList, sendPrompt, cancelTurn, respondToPermission } =
    useAgentChat();
  const transcript = snapshot?.transcript;
  const agentName = activeAgent?.name ?? "";
  const hasPlan = !!transcript?.plan?.length;
  const showAside = supportsList || hasPlan || !!transcript?.usage;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-3xl px-4 pt-3 empty:hidden">
          <AgentChatStatusBanner />
        </div>
        <div className="min-h-0 flex-1">
          {transcript && transcript.items.length > 0 ? (
            <TranscriptView
              items={transcript.items}
              permissions={snapshot.permissions}
              prompting={snapshot.prompting}
              onRespondToPermission={respondToPermission}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4">
              {activeAgent && (
                <EmptyStateCompact
                  title={t("agents.empty.start_title", { name: agentName })}
                  description={activeAgent.description || t("agents.empty.start_description")}
                  align="center"
                />
              )}
            </div>
          )}
        </div>
        {hasPlan && transcript?.plan && (
          <div className="mx-auto w-full max-w-3xl px-4 pb-2 md:hidden">
            <PlanChecklist entries={transcript.plan} />
          </div>
        )}
        <div className="border-t border-subtle px-4 py-3">
          <AgentChatComposer
            agentName={agentName}
            canPrompt={canPrompt}
            prompting={!!snapshot?.prompting}
            onSend={(text) => void sendPrompt(text)}
            onStop={() => void cancelTurn()}
            toolbar={<AgentPermissionLevelSelect />}
          />
        </div>
      </div>
      {showAside && (
        <aside className="vertical-scrollbar scrollbar-sm hidden w-72 flex-shrink-0 flex-col gap-6 overflow-y-auto border-l border-subtle p-4 md:flex">
          {hasPlan && transcript?.plan && <PlanChecklist entries={transcript.plan} />}
          {supportsList && <AgentSessionsList />}
          {transcript?.usage && <UsageMeter usage={transcript.usage} />}
        </aside>
      )}
    </div>
  );
});

type Props = { workspaceSlug: string };

/** The agent chat page: loads the workspace's agents, opens a chat and lays out the transcript. */
export const AgentChatRoot = observer(function AgentChatRoot({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const store = useAgentChat();
  const { fetchAgents, openChat, closeChat } = store;
  const {
    error: agentsError,
    isLoading,
    mutate,
  } = useSWR(`WORKSPACE_AGENTS_${workspaceSlug}`, () => fetchAgents(workspaceSlug));
  const agents = store.getWorkspaceAgents(workspaceSlug);
  const chatAgentId = store.workspaceSlug === workspaceSlug ? store.agentId : null;
  const firstAgentId = agents?.[0]?.id;

  // Open a chat with the member's last agent (or the first one) once the agents are known.
  useEffect(() => {
    if (!agents || !firstAgentId) return;
    if (chatAgentId && agents.some((agent) => agent.id === chatAgentId)) return;
    const remembered = recallAgent(workspaceSlug);
    const initial = agents.find((agent) => agent.id === remembered)?.id ?? firstAgentId;
    void openChat(workspaceSlug, initial);
  }, [agents, firstAgentId, chatAgentId, workspaceSlug, openChat]);

  // Leaving the page closes the socket: the bridge caps open chats per member.
  useEffect(() => () => closeChat(), [closeChat]);

  if (isLoading && !agents) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (agentsError && !agents) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyStateCompact
          title={t("agents.empty.load_failed_title")}
          description={t("agents.empty.load_failed_description")}
          align="center"
          actions={[{ label: t("agents.errors.retry"), variant: "secondary", onClick: () => void mutate() }]}
        />
      </div>
    );
  }

  if (!agents?.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyStateCompact
          title={t("agents.empty.no_agents_title")}
          description={t("agents.empty.no_agents_description")}
          align="center"
        />
      </div>
    );
  }

  return <AgentChatLayout />;
});
