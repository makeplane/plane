/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { List, ListItem, ListItemButton } from "@makeplane/propel/components/list";
import { RefreshOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { calculateTimeAgoShort } from "@plane/utils";
// hooks
import { useAgentChat } from "@/hooks/store/use-agent-chat";

/** Earlier chats with this agent (ACP `session/list`); opening one replays it (`session/load`). */
export const AgentSessionsList = observer(function AgentSessionsList() {
  const { t } = useTranslation();
  const { sessions, sessionsLoading, supportsLoad, snapshot, fetchSessions, loadSession } = useAgentChat();
  const currentId = snapshot?.sessionId;
  const disabled = snapshot?.status !== "ready" || !!snapshot?.prompting;

  return (
    <section aria-labelledby="agent-sessions-title" className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 id="agent-sessions-title" className="text-body-xs-medium text-primary">
          {t("agents.sessions.title")}
        </h2>
        <IconButton
          variant="ghost"
          size="sm"
          icon={<RefreshOutline />}
          aria-label={t("agents.sessions.refresh")}
          loading={sessionsLoading}
          disabled={disabled}
          onClick={() => void fetchSessions()}
        />
      </div>
      {sessions.length === 0 ? (
        <p className="text-caption-md-regular text-tertiary">{t("agents.sessions.empty")}</p>
      ) : (
        <List>
          {sessions.map((session) => {
            const isCurrent = session.sessionId === currentId;
            return (
              <ListItem key={session.sessionId}>
                <ListItemButton
                  label={session.title?.trim() || t("agents.sessions.untitled")}
                  {...(session.updatedAt ? { count: calculateTimeAgoShort(session.updatedAt) } : {})}
                  aria-current={isCurrent ? "true" : undefined}
                  disabled={disabled || isCurrent || !supportsLoad}
                  onClick={() => void loadSession(session.sessionId)}
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </section>
  );
});
