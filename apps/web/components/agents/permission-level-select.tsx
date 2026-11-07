/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Select, SelectContent, SelectItem, SelectList, SelectTrigger } from "@makeplane/propel/components/select";
import { ShieldOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// hooks
import { useAgentChat } from "@/hooks/store/use-agent-chat";
// local imports
import { modeDescription, modeName } from "./helpers";

/**
 * Switches the session's permission level (ACP `session/set_mode`). The bridge already removed
 * the levels above the admin maximum from `availableModes`, so only allowed levels are offered.
 */
export const AgentPermissionLevelSelect = observer(function AgentPermissionLevelSelect() {
  const { t } = useTranslation();
  const { snapshot, setPermissionLevel } = useAgentChat();
  const modes = snapshot?.transcript.modes;
  if (!modes || modes.availableModes.length === 0) return null;
  const disabled = snapshot?.status !== "ready" || !snapshot.sessionId;

  return (
    <Select<string>
      items={modes.availableModes.map((mode) => ({ value: mode.id, label: modeName(t, mode) }))}
      value={modes.currentModeId}
      disabled={disabled}
      onValueChange={(modeId) => {
        if (modeId && modeId !== modes.currentModeId) void setPermissionLevel(modeId);
      }}
    >
      <SelectTrigger
        size="md"
        variant="ghost"
        width="fit"
        icon={<ShieldOutline />}
        aria-label={t("agents.permission.label")}
      />
      <SelectContent side="top" align="start">
        <SelectList>
          {modes.availableModes.map((mode) => {
            const description = modeDescription(t, mode);
            return (
              <SelectItem
                key={mode.id}
                value={mode.id}
                size="md"
                label={modeName(t, mode)}
                {...(description ? { description } : {})}
              />
            );
          })}
        </SelectList>
      </SelectContent>
    </Select>
  );
});
