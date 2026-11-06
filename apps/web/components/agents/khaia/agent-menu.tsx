/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ChevronDownOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// components
import { Button } from "@/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
// hooks
import { useAgentChat } from "@/hooks/store/use-agent-chat";
// local imports
import { rememberAgent } from "../helpers";

type Props = { workspaceSlug: string };

/** Which registered agent Khaia answers with. Switching starts a new chat with that agent. */
export const KhaiaAgentMenu = observer(function KhaiaAgentMenu({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const { getWorkspaceAgents, agentId, activeAgent, openChat } = useAgentChat();
  const agents = getWorkspaceAgents(workspaceSlug) ?? [];
  const label = activeAgent?.name ?? t("agents.picker.placeholder");

  // One agent: nothing to choose, so just say which one it is.
  if (agents.length < 2) return <span className="truncate text-caption-md-regular text-tertiary">{label}</span>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-6 max-w-full gap-1 px-2 text-caption-md-regular text-tertiary"
            aria-label={t("agents.khaia.agent_menu_label", { agent: label })}
          />
        }
      >
        <span className="truncate">{label}</span>
        <ChevronDownOutline className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("agents.picker.placeholder")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={agentId ?? ""}
            onValueChange={(next: string) => {
              if (!next || next === agentId) return;
              rememberAgent(workspaceSlug, next);
              void openChat(workspaceSlug, next);
            }}
          >
            {agents.map((agent) => (
              <DropdownMenuRadioItem key={agent.id} value={agent.id}>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-primary">{agent.name}</span>
                  {agent.description && (
                    <span className="line-clamp-2 text-caption-sm-regular text-tertiary">{agent.description}</span>
                  )}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
