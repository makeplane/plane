/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Select, SelectContent, SelectItem, SelectList, SelectTrigger } from "@makeplane/propel/components/select";
import { useTranslation } from "@plane/i18n";
// hooks
import { useAgentChat } from "@/hooks/store/use-agent-chat";
// local imports
import { rememberAgent } from "./helpers";

type Props = { workspaceSlug: string };

/** Picks the agent to chat with. Switching closes the current chat and opens a new one. */
export const AgentPicker = observer(function AgentPicker({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const { getWorkspaceAgents, agentId, openChat } = useAgentChat();
  const agents = getWorkspaceAgents(workspaceSlug) ?? [];
  if (agents.length === 0) return null;

  return (
    <Select<string>
      items={agents.map((agent) => ({ value: agent.id, label: agent.name }))}
      value={agentId}
      onValueChange={(nextAgentId) => {
        if (!nextAgentId || nextAgentId === agentId) return;
        rememberAgent(workspaceSlug, nextAgentId);
        void openChat(workspaceSlug, nextAgentId);
      }}
    >
      <SelectTrigger
        size="md"
        variant="secondary"
        width="fit"
        placeholder={t("agents.picker.placeholder")}
        aria-label={t("agents.picker.label")}
      />
      <SelectContent side="bottom" align="end">
        <SelectList>
          {agents.map((agent) => (
            <SelectItem
              key={agent.id}
              value={agent.id}
              size="md"
              label={agent.name}
              {...(agent.description ? { description: agent.description } : {})}
            />
          ))}
        </SelectList>
      </SelectContent>
    </Select>
  );
});
