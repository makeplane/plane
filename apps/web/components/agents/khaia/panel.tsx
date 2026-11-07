/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { observer } from "mobx-react";
import { MinimizeOutline, NewChatOutline, NewTabArrowOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// components
import { Button } from "@/components/ui/shadcn/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
// hooks
import { useAgentChat } from "@/hooks/store/use-agent-chat";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { AgentChatStatusBanner } from "../connection-banner";
import { AgentEffortMenu } from "../effort-menu";
import { AgentModelPicker } from "../model-picker";
import { AgentPermissionLevelSelect } from "../permission-level-select";
import { TranscriptView } from "../transcript/transcript-view";
import { KhaiaAvatar } from "./avatar";
import { KhaiaComposer } from "./composer";
import { KHAIA_NAME, KHAIA_SUGGESTIONS } from "./constants";

function HeaderButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

const KhaiaEmptyState = observer(function KhaiaEmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  const { t } = useTranslation();
  const { canPrompt } = useAgentChat();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-8 text-center">
      <KhaiaAvatar size="lg" />
      <div className="flex flex-col gap-1">
        <p className="text-body-sm-medium text-primary">{t("agents.khaia.greeting", { name: KHAIA_NAME })}</p>
        <p className="text-caption-md-regular text-tertiary">{t("agents.empty.start_description")}</p>
      </div>
      <div className="flex w-full flex-col gap-1.5">
        {KHAIA_SUGGESTIONS.map((key) => {
          const prompt = t(`agents.khaia.suggestions.${key}`);
          return (
            <Button
              key={key}
              variant="outline"
              className="h-auto justify-start py-2 text-left whitespace-normal"
              disabled={!canPrompt}
              onClick={() => onPick(prompt)}
            >
              {prompt}
            </Button>
          );
        })}
      </div>
    </div>
  );
});

type Props = {
  workspaceSlug: string;
  onMinimize: () => void;
  className?: string;
};

/** The open widget: header with the agent switcher and actions, the transcript and the composer. */
export const KhaiaPanel = observer(function KhaiaPanel({ workspaceSlug, onMinimize, className }: Props) {
  const { t } = useTranslation();
  const router = useAppRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { snapshot, activeAgent, canPrompt, sendPrompt, cancelTurn, startNewSession, respondToPermission } =
    useAgentChat();
  const transcript = snapshot?.transcript;
  const prompting = !!snapshot?.prompting;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape minimizes, unless it was meant for a menu or tooltip (those render in portals, outside the card).
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape" || !event.currentTarget.contains(event.target as Node)) return;
    event.stopPropagation();
    onMinimize();
  };

  return (
    <Card
      role="dialog"
      aria-label={t("agents.empty.start_title", { name: KHAIA_NAME })}
      onKeyDown={handleKeyDown}
      className={cn("transition-[opacity,transform] duration-150 starting:translate-y-2 starting:opacity-0", className)}
    >
      <CardHeader className="border-b">
        <KhaiaAvatar />
        <div className="flex min-w-0 flex-col items-start">
          <CardTitle>{KHAIA_NAME}</CardTitle>
          {activeAgent && (
            <span className="max-w-full truncate text-caption-md-regular text-tertiary">{activeAgent.name}</span>
          )}
        </div>
        <CardAction>
          <HeaderButton label={t("agents.sessions.new")} onClick={() => void startNewSession()}>
            <NewChatOutline />
          </HeaderButton>
          <HeaderButton label={t("agents.khaia.open_page")} onClick={() => router.push(`/${workspaceSlug}/agents/`)}>
            <NewTabArrowOutline />
          </HeaderButton>
          <HeaderButton label={t("agents.khaia.minimize")} onClick={onMinimize}>
            <MinimizeOutline />
          </HeaderButton>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col">
        <div className="px-3 pt-3 empty:hidden">
          <AgentChatStatusBanner />
        </div>
        <div className="min-h-0 flex-1">
          {transcript && transcript.items.length > 0 ? (
            <TranscriptView
              items={transcript.items}
              permissions={snapshot.permissions}
              prompting={prompting}
              onRespondToPermission={respondToPermission}
            />
          ) : (
            <KhaiaEmptyState onPick={(prompt) => void sendPrompt(prompt)} />
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <KhaiaComposer
          inputRef={inputRef}
          canPrompt={canPrompt}
          prompting={prompting}
          onSend={(text) => void sendPrompt(text)}
          onStop={() => void cancelTurn()}
          toolbar={
            <>
              <AgentModelPicker />
              <AgentEffortMenu />
              <AgentPermissionLevelSelect />
            </>
          }
        />
      </CardFooter>
    </Card>
  );
});
