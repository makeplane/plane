/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Select, SelectContent, SelectItem, SelectList, SelectTrigger } from "@makeplane/propel/components/select";
import { selectChoices } from "@plane/acp-client";
import { useTranslation } from "@plane/i18n";
// hooks
import { useAgentChat } from "@/hooks/store/use-agent-chat";

/** The session's model, from the agent's `model` config option. */
export const AgentModelSelect = observer(function AgentModelSelect() {
  const { t } = useTranslation();
  const { modelConfig, snapshot, setModel } = useAgentChat();
  const choices = selectChoices(modelConfig);
  if (!modelConfig || modelConfig.type !== "select" || choices.length === 0) return null;
  const disabled = snapshot?.status !== "ready" || !!snapshot?.prompting;

  return (
    <Select<string>
      items={choices.map((choice) => ({ value: choice.value, label: choice.name }))}
      value={modelConfig.currentValue}
      disabled={disabled}
      onValueChange={(value) => {
        if (value && value !== modelConfig.currentValue) void setModel(value);
      }}
    >
      <SelectTrigger size="md" variant="secondary" width="fit" aria-label={t("agents.model.label")} />
      <SelectContent side="bottom" align="end">
        <SelectList>
          {choices.map((choice) => (
            <SelectItem
              key={choice.value}
              value={choice.value}
              size="md"
              label={choice.name}
              {...(choice.description ? { description: choice.description } : {})}
            />
          ))}
        </SelectList>
      </SelectContent>
    </Select>
  );
});
