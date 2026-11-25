/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { TelegramIntegrationService } from "@/services/integrations/telegram.service";

const service = new TelegramIntegrationService();

type Props = { workspaceSlug: string };

export const TelegramIntegrationSettings = observer(function TelegramIntegrationSettings({ workspaceSlug }: Props) {
  const { projectMap } = useProject();
  const { currentWorkspace } = useWorkspace();
  const { data: integration, mutate: refreshIntegration } = useSWR(`telegram-integration-${workspaceSlug}`, () =>
    service.getIntegration(workspaceSlug)
  );
  const { data: chats, mutate: refreshChats } = useSWR(integration ? `telegram-chats-${workspaceSlug}` : null, () =>
    service.getChats(workspaceSlug)
  );
  const [botToken, setBotToken] = useState("");
  const [projectId, setProjectId] = useState("");
  const [chatId, setChatId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setError("");
    try {
      await action();
      setToast({ type: "success", title: success });
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        "Telegram setup failed. Please try again.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const availableProjects = Object.values(projectMap).filter(
    (project) =>
      project.workspace === currentWorkspace?.id &&
      !project.archived_at &&
      !chats?.some((chat) => chat.project_id === project.id)
  );

  return (
    <section className="border-b border-subtle px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-body-sm-medium">Telegram</h3>
          <p className="text-body-xs-regular text-secondary">
            Connect a bot to post project updates and create work items from group messages.
          </p>
        </div>
        {integration && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              stretch="auto"
              loading={busy}
              onClick={() =>
                run(async () => {
                  await service.connect(workspaceSlug, "");
                }, "Telegram webhook registered")
              }
              label="Register webhook"
            />
            <Button
              variant="danger"
              size="sm"
              stretch="auto"
              loading={busy}
              onClick={() =>
                run(async () => {
                  await service.disconnect(workspaceSlug);
                  await refreshIntegration();
                }, "Telegram disconnected")
              }
              label="Disconnect"
            />
          </div>
        )}
      </div>

      {integration === null && (
        <form
          className="mt-4 flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            run(async () => {
              try {
                await service.connect(workspaceSlug, botToken);
              } finally {
                await refreshIntegration();
              }
              setBotToken("");
            }, "Telegram connected");
          }}
        >
          <label className="flex min-w-72 flex-col gap-1 text-body-xs-medium">
            Bot token from BotFather
            <input
              className="rounded border border-subtle bg-surface-1 px-3 py-2 text-body-sm-regular"
              type="password"
              autoComplete="off"
              required
              value={botToken}
              onChange={(event) => setBotToken(event.target.value)}
            />
          </label>
          <Button type="submit" variant="primary" size="sm" stretch="auto" loading={busy} label="Connect bot" />
        </form>
      )}

      {integration && (
        <div className="mt-4 space-y-4 text-body-xs-regular">
          <p>
            Connected as @{integration.bot_username}. Add this bot to a group, then send
            <code> /plane@{integration.bot_username} chat</code> there to find its chat and topic IDs.
          </p>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                await service.addChat(workspaceSlug, projectId, chatId, topicId);
                setProjectId("");
                setChatId("");
                setTopicId("");
                await refreshChats();
              }, "Telegram chat mapped");
            }}
          >
            <label className="flex flex-col gap-1">
              Project
              <select
                className="rounded border border-subtle bg-surface-1 px-3 py-2"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                required
              >
                <option value="">Choose a project</option>
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              Chat ID
              <input
                className="rounded border border-subtle bg-surface-1 px-3 py-2"
                value={chatId}
                onChange={(event) => setChatId(event.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              Topic ID (optional)
              <input
                className="rounded border border-subtle bg-surface-1 px-3 py-2"
                value={topicId}
                onChange={(event) => setTopicId(event.target.value)}
              />
            </label>
            <Button type="submit" variant="primary" size="sm" stretch="auto" loading={busy} label="Map chat" />
          </form>
          {chats?.map((chat) => (
            <div key={chat.id} className="flex items-center justify-between gap-3 rounded border border-subtle p-3">
              <span>
                {projectMap[chat.project_id]?.name ?? "Project"} → {chat.chat_title}
                {chat.topic_id ? ` (topic ${chat.topic_id})` : ""}
              </span>
              <Button
                variant="danger"
                size="sm"
                stretch="auto"
                loading={busy}
                onClick={() =>
                  run(async () => {
                    await service.removeChat(workspaceSlug, chat.id);
                    await refreshChats();
                  }, "Telegram chat removed")
                }
                label="Remove"
              />
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-3 text-body-xs-regular text-danger-primary">{error}</p>}
    </section>
  );
});
