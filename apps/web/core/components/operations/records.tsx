/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Records: the documents that are not work.
 *
 * An RCA, an outage write-up, an architecture decision. They have no state and
 * no assignee on purpose — filing one as a work item would put it in every
 * burndown and every velocity number. What they do have is a type, a date and
 * full-text search.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { Plus } from "lucide-react";
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
  type TOperationsRecord,
  type TOperationsRecordPayload,
  type TOperationsRecordType,
} from "@/services/operations";
// local imports
import { EmptyPanel, ErrorPanel, LoadingPanel, Pill, Section, formatDateTime } from "./common";
import { RECORD_TYPE_LABEL, RECORD_TYPES } from "./constants";
import { OperationsMember } from "./member";

type CreateProps = {
  workspaceSlug: string;
  isOpen: boolean;
  record?: TOperationsRecord | null;
  onClose: () => void;
  onSaved: () => void;
};

export const RecordModal = observer(function RecordModal({
  workspaceSlug,
  isOpen,
  record,
  onClose,
  onSaved,
}: CreateProps) {
  const { joinedProjectIds, getProjectById } = useProject();
  const [form, setForm] = useState<TOperationsRecordPayload>(() => ({
    record_type: record?.record_type ?? "meeting_notes",
    name: record?.name ?? "",
    description_html: record?.description_stripped ?? "",
    project: record?.project ?? null,
    occurred_at: record?.occurred_at ?? null,
  }));
  const [isSaving, setIsSaving] = useState(false);

  const set = <K extends keyof TOperationsRecordPayload>(key: K, value: TOperationsRecordPayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!form.name?.trim()) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Title required", message: "Give the record a title." });
      return;
    }
    setIsSaving(true);
    const payload: TOperationsRecordPayload = {
      ...form,
      description_html: form.description_html ? `<p>${form.description_html}</p>` : "<p></p>",
    };
    try {
      if (record) await operationsService.updateRecord(workspaceSlug, record.id, payload);
      else await operationsService.createRecord(workspaceSlug, payload);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Saved", message: "The record has been saved." });
      onSaved();
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Not saved", message: "The record could not be saved." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} width={EModalWidth.XXXL}>
      <div className="flex flex-col gap-4 p-5">
        <h2 className="text-15 font-semibold text-primary">{record ? "Edit record" : "New record"}</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-11 font-medium tracking-wide text-tertiary uppercase">
            Type
            <select
              value={form.record_type}
              onChange={(event) => set("record_type", event.target.value as TOperationsRecordType)}
              className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13 text-primary"
            >
              {RECORD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {RECORD_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-11 font-medium tracking-wide text-tertiary uppercase">
            Project
            <select
              value={form.project ?? ""}
              onChange={(event) => set("project", event.target.value || null)}
              className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13 text-primary"
            >
              <option value="">Workspace-wide</option>
              {joinedProjectIds.map((projectId) => (
                <option key={projectId} value={projectId}>
                  {getProjectById(projectId)?.name ?? "Project"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <input
          value={form.name ?? ""}
          onChange={(event) => set("name", event.target.value)}
          placeholder="Title"
          className="w-full rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13 text-primary placeholder:text-placeholder"
        />

        <label className="flex flex-col gap-1 text-11 font-medium tracking-wide text-tertiary uppercase">
          When it happened
          <input
            type="datetime-local"
            value={form.occurred_at ? form.occurred_at.slice(0, 16) : ""}
            onChange={(event) =>
              set("occurred_at", event.target.value ? new Date(event.target.value).toISOString() : null)
            }
            className="w-60 rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13 text-primary"
          />
        </label>

        <textarea
          rows={10}
          value={form.description_html ?? ""}
          onChange={(event) => set("description_html", event.target.value)}
          placeholder="What happened, what was decided, what changes as a result."
          className="w-full resize-y rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13 text-primary placeholder:text-placeholder"
        />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={submit} loading={isSaving}>
            Save record
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});

export const RecordList = observer(function RecordList({ workspaceSlug }: { workspaceSlug: string }) {
  const { getProjectById } = useProject();
  const [type, setType] = useState<string>("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<TOperationsRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug ? ["operations-records", workspaceSlug, type, query] : null,
    () => operationsService.getRecords(workspaceSlug, { record_type: type, query }),
    { revalidateOnFocus: false }
  );

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Records"
        description="Incidents, RCAs, decisions and meetings — searchable and auditable, and out of the delivery metrics"
        action={
          <Button variant="primary" size="lg" prependIcon={<Plus />} onClick={() => setIsCreating(true)}>
            New record
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setType("")}
              className={cn(
                "rounded-full px-3 py-1 text-11 font-medium transition-colors",
                type === "" ? "bg-accent-primary text-on-color" : "bg-layer-3 text-secondary hover:bg-layer-3-hover"
              )}
            >
              All
            </button>
            {RECORD_TYPES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={cn(
                  "rounded-full px-3 py-1 text-11 font-medium transition-colors",
                  type === option
                    ? "bg-accent-primary text-on-color"
                    : "bg-layer-3 text-secondary hover:bg-layer-3-hover"
                )}
              >
                {RECORD_TYPE_LABEL[option]}
              </button>
            ))}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search records"
              className="ml-auto w-56 rounded-md border border-subtle bg-layer-1 px-2 py-1 text-13 text-primary placeholder:text-placeholder"
            />
          </div>

          {isLoading ? (
            <LoadingPanel />
          ) : error ? (
            <ErrorPanel />
          ) : (data?.results.length ?? 0) === 0 ? (
            <EmptyPanel label="No records here yet" />
          ) : (
            <ul className="flex flex-col gap-2">
              {data?.results.map((record) => (
                <li key={record.id} className="rounded-md border border-subtle p-3">
                  <button type="button" onClick={() => setEditing(record)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill>{RECORD_TYPE_LABEL[record.record_type]}</Pill>
                          {record.project && <Pill>{getProjectById(record.project)?.name ?? "Project"}</Pill>}
                        </div>
                        <h3 className="mt-1.5 truncate text-13 font-medium text-primary">{record.name}</h3>
                        {record.description_stripped && (
                          <p className="mt-1 line-clamp-2 text-13 text-secondary">{record.description_stripped}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-11 text-placeholder">
                        {formatDateTime(record.occurred_at ?? record.created_at)}
                      </span>
                    </div>
                  </button>

                  {(record.issues.length > 0 || record.created_by) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {record.created_by && <OperationsMember memberId={record.created_by} />}
                      {record.issues.map((issue) => (
                        <Link
                          key={issue.id}
                          href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
                          className="max-w-full min-w-0 hover:underline"
                        >
                          <Pill className="max-w-full truncate">{issue.name}</Pill>
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      {isCreating && (
        <RecordModal
          workspaceSlug={workspaceSlug}
          isOpen
          onClose={() => setIsCreating(false)}
          onSaved={() => void mutate()}
        />
      )}
      {editing && (
        <RecordModal
          key={editing.id}
          workspaceSlug={workspaceSlug}
          isOpen
          record={editing}
          onClose={() => setEditing(null)}
          onSaved={() => void mutate()}
        />
      )}
    </div>
  );
});
