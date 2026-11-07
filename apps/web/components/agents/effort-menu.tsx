/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useId } from "react";
import { observer } from "mobx-react";
import { ChevronDownOutline, ThoughtsOutline } from "@makeplane/propel/icons";
import { selectChoices } from "@plane/acp-client";
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
import { effortName } from "./helpers";

/**
 * How hard the model thinks, from the session's `thought_level` option. Hidden while the model
 * takes no effort. A change applies from the next message on.
 */
export const AgentEffortMenu = observer(function AgentEffortMenu() {
  const { t } = useTranslation();
  const hintId = useId();
  const { effortConfig, snapshot, setEffort } = useAgentChat();
  const levels = effortConfig?.type === "select" ? selectChoices(effortConfig) : [];
  if (!effortConfig || levels.length === 0) return null;
  const current = levels.find((choice) => choice.value === effortConfig.currentValue);
  const currentName = current ? effortName(t, current) : String(effortConfig.currentValue);
  const disabled = snapshot?.status !== "ready" || !!snapshot?.prompting;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-caption-md-regular text-secondary"
            aria-label={t("agents.effort.trigger_label", { level: currentName })}
          />
        }
      >
        <ThoughtsOutline className="size-3.5" />
        <span>{currentName}</span>
        <ChevronDownOutline className="size-3 text-tertiary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("agents.effort.label")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={effortConfig.currentValue}
            aria-describedby={hintId}
            onValueChange={(next: string) => {
              if (next && next !== effortConfig.currentValue) void setEffort(next);
            }}
          >
            {levels.map((choice) => (
              <DropdownMenuRadioItem key={choice.value} value={choice.value} closeOnClick>
                <div className="flex min-w-0 flex-col">
                  <span className="text-primary">{effortName(t, choice)}</span>
                  {choice.description && (
                    <span className="line-clamp-2 text-caption-sm-regular text-tertiary">{choice.description}</span>
                  )}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <p id={hintId} className="px-2 pb-1 text-caption-sm-regular text-tertiary">
            {t("agents.effort.hint")}
          </p>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
