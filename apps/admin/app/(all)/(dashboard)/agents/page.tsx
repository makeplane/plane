/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import useSWR from "swr";
// plane imports
import { Badge } from "@makeplane/propel/components/badge";
import { Button } from "@makeplane/propel/components/button";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Claude, Codex, Deepseek, DeleteOutline, EditOutline, PlusCircleOutline } from "@makeplane/propel/icons";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { Skeleton } from "@plane/blocks/skeleton";
import { setToast } from "@plane/blocks/toast";
import { AGENT_ADAPTERS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { InstanceAgentService } from "@plane/services";
import type { TAgentAdapter, TInstanceAgent } from "@plane/types";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// types
import type { Route } from "./+types/page";
// local imports
import { AgentFormDialog } from "./agent-form-dialog";

const agentService = new InstanceAgentService();
const AGENTS_KEY = "INSTANCE_AGENTS";

const ADAPTER_ICONS: Record<TAgentAdapter, typeof Claude> = { claude: Claude, codex: Codex, deepseek: Deepseek };

/** The dialog state: closed, adding, or editing an agent. `key` remounts the form on every open. */
type TDialogState = { open: false } | { open: true; key: number; agent?: TInstanceAgent };

function AgentRow({ agent, onEdit, onDelete }: { agent: TInstanceAgent; onEdit: () => void; onDelete: () => void }) {
  const { t } = useTranslation();
  const Icon = ADAPTER_ICONS[agent.adapter];
  // An adapter this build does not know (e.g. one added on the API later) shows its id.
  const adapterLabel = AGENT_ADAPTERS.includes(agent.adapter)
    ? t(`agents.admin.form.adapters.${agent.adapter}`)
    : agent.adapter;
  return (
    <li className="flex items-start justify-between gap-4 border-b border-subtle py-4 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-8 flex-shrink-0 items-center justify-center rounded-md bg-layer-2">
          {Icon && <Icon className="size-4" />}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-body-sm-medium text-primary">{agent.name}</span>
            <code className="text-caption-md-regular text-tertiary">{agent.slug}</code>
          </div>
          {agent.description && <p className="text-body-xs-regular text-secondary">{agent.description}</p>}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge size="sm" variant="neutral" label={adapterLabel} />
            <Badge
              size="sm"
              variant={agent.is_enabled ? "success" : "grey"}
              label={t(agent.is_enabled ? "agents.admin.list.enabled" : "agents.admin.list.disabled")}
            />
            {agent.attach_plane_mcp && <Badge size="sm" variant="info" label={t("agents.admin.list.plane_mcp")} />}
            <Badge
              size="sm"
              variant="neutral"
              label={t("agents.admin.list.max_level", {
                level: t(`agents.permission.levels.${agent.max_permission_level}.name`),
              })}
            />
            {agent.env_decryption_failed && (
              <Badge size="sm" variant="danger" label={t("agents.admin.list.env_unreadable")} />
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        <IconButton
          variant="ghost"
          size="md"
          icon={<EditOutline />}
          aria-label={t("agents.admin.edit_named", { name: agent.name })}
          onClick={onEdit}
        />
        <IconButton
          variant="ghost"
          size="md"
          icon={<DeleteOutline />}
          aria-label={`${t("agents.admin.delete")}: ${agent.name}`}
          onClick={onDelete}
        />
      </div>
    </li>
  );
}

function InstanceAgentsPage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const { data: agents, error, isLoading, mutate } = useSWR(AGENTS_KEY, () => agentService.list());
  const [dialog, setDialog] = useState<TDialogState>({ open: false });
  const [deleting, setDeleting] = useState<TInstanceAgent | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  const openDialog = (agent?: TInstanceAgent) =>
    setDialog({ open: true, key: Date.now(), ...(agent ? { agent } : {}) });

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await agentService.destroy(deleting.id);
      await mutate((current) => current?.filter((agent) => agent.id !== deleting.id), { revalidate: false });
      setToast({ type: "success", title: t("agents.admin.toasts.deleted") });
      setDeleting(undefined);
    } catch {
      setToast({
        type: "error",
        title: t("agents.admin.toasts.error_title"),
        message: t("agents.admin.toasts.delete_failed"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageWrapper
      header={{
        title: t("agents.admin.title"),
        description: t("agents.admin.description"),
        actions: (
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            icon={<PlusCircleOutline />}
            label={t("agents.admin.add")}
            onClick={() => openDialog()}
          />
        ),
      }}
    >
      {isLoading && !agents ? (
        <Skeleton className="space-y-4">
          <Skeleton.Item height="64px" width="100%" />
          <Skeleton.Item height="64px" width="100%" />
        </Skeleton>
      ) : error && !agents ? (
        <EmptyStateCompact
          title={t("agents.admin.list.load_failed")}
          align="start"
          actions={[{ label: t("agents.errors.retry"), variant: "secondary", onClick: () => void mutate() }]}
        />
      ) : !agents?.length ? (
        <EmptyStateCompact
          title={t("agents.admin.list.empty_title")}
          description={t("agents.admin.list.empty_description")}
          align="start"
          actions={[{ label: t("agents.admin.add"), variant: "primary", onClick: () => openDialog() }]}
        />
      ) : (
        <ul>
          {agents.map((agent) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              onEdit={() => openDialog(agent)}
              onDelete={() => setDeleting(agent)}
            />
          ))}
        </ul>
      )}

      {dialog.open && (
        <AgentFormDialog
          key={dialog.key}
          isOpen
          {...(dialog.agent ? { agent: dialog.agent } : {})}
          onClose={() => setDialog({ open: false })}
          onSaved={() => {
            setDialog({ open: false });
            void mutate();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleting}
        title={t("agents.admin.delete_dialog.title")}
        content={t("agents.admin.delete_dialog.description", { name: deleting?.name ?? "" })}
        handleClose={() => {
          if (!isDeleting) setDeleting(undefined);
        }}
        handleSubmit={handleDelete}
        isSubmitting={isDeleting}
        primaryButtonText={{
          default: t("agents.admin.delete_dialog.confirm"),
          loading: t("agents.admin.delete_dialog.deleting"),
        }}
        secondaryButtonText={t("agents.admin.form.cancel")}
      />
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Agents - God Mode" }];

export default InstanceAgentsPage;
