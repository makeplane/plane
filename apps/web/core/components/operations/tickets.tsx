/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Operations requests.
 *
 * A request is not a work item and this screen keeps that distinction visible:
 * it has a lifecycle of its own, and the only way out of it into engineering is
 * the convert action, which happens once and leaves both records linked.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowRight, Plus } from "lucide-react";
// workspaces imports
import { Button } from "@workspaces/propel/button";
import { setToast, TOAST_TYPE } from "@workspaces/propel/toast";
import { EModalWidth, ModalCore } from "@workspaces/ui";
import { cn } from "@workspaces/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
// services
import {
  operationsService,
  type TOperationsTicketPayload,
  type TOperationsTicketPriority,
  type TOperationsTicketSource,
  type TOperationsTicketStatus,
} from "@/services/operations";
// local imports
import { EmptyPanel, ErrorPanel, LoadingPanel, Pill, Section, formatDate } from "./common";
import {
  PRIORITY_CLASS,
  PRIORITY_LABEL,
  TICKET_SOURCE_LABEL,
  TICKET_STATUS_CLASS,
  TICKET_STATUS_LABEL,
  TICKET_TRANSITIONS,
} from "./constants";
import { OperationsMember } from "./member";

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "new", label: "New" },
  { key: "pm_review", label: "In review" },
  { key: "need_info", label: "Need info" },
  { key: "approved", label: "Approved" },
  { key: "converted", label: "Converted" },
  { key: "closed", label: "Closed" },
];

// ------------------------------------------------------------------ Create

type CreateProps = { workspaceSlug: string; isOpen: boolean; onClose: () => void; onCreated: () => void };

export const CreateTicketModal = observer(function CreateTicketModal({
  workspaceSlug,
  isOpen,
  onClose,
  onCreated,
}: CreateProps) {
  const { joinedProjectIds, getProjectById } = useProject();
  const [form, setForm] = useState<TOperationsTicketPayload>({ source: "internal", priority: "medium" });
  const [isSaving, setIsSaving] = useState(false);

  const set = <K extends keyof TOperationsTicketPayload>(key: K, value: TOperationsTicketPayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!form.name?.trim()) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Title required", message: "Give the request a title." });
      return;
    }
    setIsSaving(true);
    try {
      await operationsService.createTicket(workspaceSlug, {
        ...form,
        description_html: form.description_html ? `<p>${form.description_html}</p>` : "<p></p>",
      });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Filed", message: "The request has been filed." });
      setForm({ source: "internal", priority: "medium" });
      onCreated();
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Not filed", message: "The request could not be filed." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} width={EModalWidth.XXL}>
      <div className="flex flex-col gap-4 p-5">
        <h2 className="text-15 font-semibold text-primary">New operations request</h2>

        <input
          value={form.name ?? ""}
          onChange={(event) => set("name", event.target.value)}
          placeholder="What is being asked for?"
          className="w-full rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13 text-primary placeholder:text-placeholder"
        />

        <textarea
          rows={5}
          value={form.description_html ?? ""}
          onChange={(event) => set("description_html", event.target.value)}
          placeholder="Context, who asked, what they expect to happen."
          className="w-full resize-y rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13 text-primary placeholder:text-placeholder"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-11 font-medium tracking-wide text-tertiary uppercase">
            Source
            <select
              value={form.source}
              onChange={(event) => set("source", event.target.value as TOperationsTicketSource)}
              className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13 text-primary"
            >
              {Object.entries(TICKET_SOURCE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-11 font-medium tracking-wide text-tertiary uppercase">
            Priority
            <select
              value={form.priority}
              onChange={(event) => set("priority", event.target.value as TOperationsTicketPriority)}
              className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13 text-primary"
            >
              {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-0 flex-col gap-1 text-11 font-medium tracking-wide text-tertiary uppercase">
            Likely project
            <select
              value={form.project ?? ""}
              onChange={(event) => set("project", event.target.value || null)}
              className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13 text-primary"
            >
              <option value="">Not decided yet</option>
              {joinedProjectIds.map((projectId) => (
                <option key={projectId} value={projectId}>
                  {getProjectById(projectId)?.name ?? "Project"}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-11 font-medium tracking-wide text-tertiary uppercase">
            Needed by
            <input
              type="date"
              value={form.target_date ?? ""}
              onChange={(event) => set("target_date", event.target.value || null)}
              className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13 text-primary"
            />
          </label>

          <label className="flex flex-col gap-1 text-11 font-medium tracking-wide text-tertiary uppercase">
            Requested by (name)
            <input
              value={form.requester_name ?? ""}
              onChange={(event) => set("requester_name", event.target.value)}
              placeholder="For requests from outside the workspace"
              className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13 text-primary placeholder:text-placeholder"
            />
          </label>

          <label className="flex flex-col gap-1 text-11 font-medium tracking-wide text-tertiary uppercase">
            Requested by (email)
            <input
              type="email"
              value={form.requester_email ?? ""}
              onChange={(event) => set("requester_email", event.target.value)}
              className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13 text-primary"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={submit} loading={isSaving}>
            File request
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});

// -------------------------------------------------------------------- List

export const TicketList = observer(function TicketList({ workspaceSlug }: { workspaceSlug: string }) {
  const [filter, setFilter] = useState("open");
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const params = useMemo(
    () => (filter === "open" ? { open: "true", query } : { status: filter, query }),
    [filter, query]
  );

  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug ? ["operations-tickets", workspaceSlug, filter, query] : null,
    () => operationsService.getTickets(workspaceSlug, params),
    { revalidateOnFocus: false }
  );

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Operations requests"
        description="Requests from sales, operations and customers, before they become work items"
        action={
          <Button variant="primary" size="lg" prependIcon={<Plus />} onClick={() => setIsCreating(true)}>
            New request
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setFilter(option.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-11 font-medium transition-colors",
                  filter === option.key
                    ? "bg-accent-primary text-on-color"
                    : "bg-layer-3 text-secondary hover:bg-layer-3-hover"
                )}
              >
                {option.label}
              </button>
            ))}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search requests"
              className="ml-auto w-56 rounded-md border border-subtle bg-layer-1 px-2 py-1 text-13 text-primary placeholder:text-placeholder"
            />
          </div>

          {isLoading ? (
            <LoadingPanel />
          ) : error ? (
            <ErrorPanel />
          ) : (data?.results.length ?? 0) === 0 ? (
            <EmptyPanel label="No requests here" />
          ) : (
            <div className="-mx-4 overflow-x-auto px-4">
              <ul className="min-w-[560px]">
                {data?.results.map((ticket) => (
                  <li key={ticket.id} className="border-b border-subtle last:border-0">
                    <button
                      type="button"
                      onClick={() => setSelected(ticket.id)}
                      className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-layer-transparent-hover"
                    >
                      <span className="w-16 shrink-0 text-11 text-placeholder">OPS-{ticket.sequence_id}</span>
                      <span className="min-w-0 flex-1 truncate text-13 text-primary">{ticket.name}</span>
                      <Pill className={PRIORITY_CLASS[ticket.priority]}>{PRIORITY_LABEL[ticket.priority]}</Pill>
                      <Pill>{TICKET_SOURCE_LABEL[ticket.source]}</Pill>
                      <Pill className={TICKET_STATUS_CLASS[ticket.status]}>{TICKET_STATUS_LABEL[ticket.status]}</Pill>
                      <span className="w-24 shrink-0 text-right text-11 text-placeholder">
                        {formatDate(ticket.created_at)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      <CreateTicketModal
        workspaceSlug={workspaceSlug}
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onCreated={() => void mutate()}
      />

      {selected && (
        <TicketDetailModal
          workspaceSlug={workspaceSlug}
          ticketId={selected}
          onClose={() => setSelected(null)}
          onChanged={() => void mutate()}
        />
      )}
    </div>
  );
});

// ------------------------------------------------------------------ Detail

type DetailProps = {
  workspaceSlug: string;
  ticketId: string;
  onClose: () => void;
  onChanged: () => void;
};

export const TicketDetailModal = observer(function TicketDetailModal({
  workspaceSlug,
  ticketId,
  onClose,
  onChanged,
}: DetailProps) {
  const { joinedProjectIds, getProjectById } = useProject();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [convertProjectId, setConvertProjectId] = useState("");

  const { data: ticket, mutate } = useSWR(
    ["operations-ticket", workspaceSlug, ticketId],
    () => operationsService.getTicket(workspaceSlug, ticketId),
    { revalidateOnFocus: false }
  );
  const { data: comments, mutate: mutateComments } = useSWR(
    ["operations-ticket-comments", workspaceSlug, ticketId],
    () => operationsService.getTicketComments(workspaceSlug, ticketId),
    { revalidateOnFocus: false }
  );
  const { data: activities, mutate: mutateActivities } = useSWR(
    ["operations-ticket-activities", workspaceSlug, ticketId],
    () => operationsService.getTicketActivities(workspaceSlug, ticketId),
    { revalidateOnFocus: false }
  );

  const refresh = async () => {
    await Promise.all([mutate(), mutateComments(), mutateActivities()]);
    onChanged();
  };

  const transition = async (status: TOperationsTicketStatus) => {
    setBusy(true);
    try {
      await operationsService.transitionTicket(workspaceSlug, ticketId, status);
      await refresh();
    } catch (transitionError) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Not moved",
        message: (transitionError as { error?: string })?.error ?? "That move is not allowed.",
      });
    } finally {
      setBusy(false);
    }
  };

  const convert = async () => {
    const projectId = convertProjectId || ticket?.project;
    if (!projectId) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Pick a project", message: "Choose where the work item should go." });
      return;
    }
    setBusy(true);
    try {
      const result = await operationsService.convertTicket(workspaceSlug, ticketId, { project_id: projectId });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Converted",
        message: `Created ${result.issue.project_identifier}-${result.issue.sequence_id}.`,
      });
      await refresh();
    } catch (convertError) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Not converted",
        message: (convertError as { error?: string })?.error ?? "The request could not be converted.",
      });
    } finally {
      setBusy(false);
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await operationsService.createTicketComment(workspaceSlug, ticketId, `<p>${comment}</p>`);
      setComment("");
      await refresh();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Not posted", message: "Your comment was not saved." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalCore isOpen handleClose={onClose} width={EModalWidth.XXXL}>
      {!ticket ? (
        <LoadingPanel />
      ) : (
        <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto p-5">
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="text-11 text-placeholder">OPS-{ticket.sequence_id}</span>
              <h2 className="text-15 font-semibold text-primary">{ticket.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Pill className={TICKET_STATUS_CLASS[ticket.status]}>{TICKET_STATUS_LABEL[ticket.status]}</Pill>
                <Pill className={PRIORITY_CLASS[ticket.priority]}>{PRIORITY_LABEL[ticket.priority]}</Pill>
                <Pill>{TICKET_SOURCE_LABEL[ticket.source]}</Pill>
                {ticket.target_date && <Pill>Needed by {formatDate(ticket.target_date)}</Pill>}
              </div>
            </div>
            <Button variant="ghost" size="lg" onClick={onClose}>
              Close
            </Button>
          </header>

          {ticket.description_stripped && (
            <p className="text-13 whitespace-pre-wrap text-secondary">{ticket.description_stripped}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 rounded-md border border-subtle bg-layer-2 p-3">
            <span className="text-11 font-medium tracking-wide text-tertiary uppercase">Move to</span>
            {TICKET_TRANSITIONS[ticket.status].length === 0 ? (
              <span className="text-11 text-placeholder">This request is finished.</span>
            ) : (
              TICKET_TRANSITIONS[ticket.status].map((status) => (
                <Button
                  key={status}
                  variant={status === "rejected" ? "error-outline" : "secondary"}
                  size="sm"
                  disabled={busy}
                  onClick={() => void transition(status)}
                >
                  {TICKET_STATUS_LABEL[status]}
                </Button>
              ))
            )}
          </div>

          {ticket.status === "approved" && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-subtle bg-layer-2 p-3">
              <span className="text-11 font-medium tracking-wide text-tertiary uppercase">Convert into</span>
              <select
                value={convertProjectId || ticket.project || ""}
                onChange={(event) => setConvertProjectId(event.target.value)}
                className="min-w-0 rounded-md border border-subtle bg-layer-1 px-2 py-1 text-13 text-primary"
              >
                <option value="">Choose a project</option>
                {joinedProjectIds.map((projectId) => (
                  <option key={projectId} value={projectId}>
                    {getProjectById(projectId)?.name ?? "Project"}
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                size="sm"
                appendIcon={<ArrowRight />}
                disabled={busy}
                onClick={() => void convert()}
              >
                Create work item
              </Button>
              <p className="w-full text-11 text-placeholder">
                Copies the description, priority and reporter, labels the work item with its source, and links the two
                records. It happens once.
              </p>
            </div>
          )}

          {ticket.converted_issue && ticket.project && (
            <Link
              href={`/${workspaceSlug}/projects/${ticket.project}/issues/${ticket.converted_issue}`}
              className="inline-flex items-center gap-1.5 text-13 text-accent-primary hover:underline"
            >
              Open the work item this became <ArrowRight className="size-3.5" />
            </Link>
          )}

          <section>
            <h3 className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">Conversation</h3>
            <ul className="flex flex-col gap-3">
              {(comments ?? []).map((entry) => (
                <li key={entry.id} className="rounded-md border border-subtle p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    {entry.actor ? (
                      <OperationsMember memberId={entry.actor} />
                    ) : (
                      <span className="text-13">System</span>
                    )}
                    <span className="text-11 text-placeholder">{formatDate(entry.created_at)}</span>
                  </div>
                  <p className="text-13 whitespace-pre-wrap text-secondary">{entry.comment_stripped}</p>
                </li>
              ))}
              {(comments?.length ?? 0) === 0 && <EmptyPanel label="No comments yet" compact />}
            </ul>

            <div className="mt-3 flex gap-2">
              <input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Ask a question, or record a decision"
                className="flex-1 rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13 text-primary placeholder:text-placeholder"
              />
              <Button variant="secondary" size="lg" disabled={busy} onClick={() => void addComment()}>
                Post
              </Button>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">Audit trail</h3>
            <ul className="flex flex-col gap-1.5">
              {(activities ?? []).map((activity) => (
                <li key={activity.id} className="flex items-center gap-2 text-11 text-placeholder">
                  <span>{formatDate(activity.created_at)}</span>
                  <span className="text-secondary">
                    {activity.verb}
                    {activity.field ? ` ${activity.field}` : ""}
                    {activity.new_value ? `: ${activity.new_value}` : ""}
                  </span>
                </li>
              ))}
              {(activities?.length ?? 0) === 0 && <EmptyPanel label="Nothing recorded yet" compact />}
            </ul>
          </section>
        </div>
      )}
    </ModalCore>
  );
});
