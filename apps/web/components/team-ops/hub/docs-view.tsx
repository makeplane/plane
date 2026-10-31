/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import { InputField } from "@makeplane/propel/components/input-field";
import { SelectField } from "@makeplane/propel/components/select-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { setToast } from "@plane/blocks/toast";
import type { THubDoc } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useUser } from "@/hooks/store/user";
import { useProject } from "@/hooks/store/use-project";
import { hubExtraService, useHubDocs } from "@/hooks/team-ops/use-hub";
// local imports
import { getErrorMessage } from "../calendar/error-message";

type Props = { workspaceSlug: string };

const NONE = "none";
const dateFormat = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" });

type Draft = { id?: string; title: string; body: string; tags: string; project: string };
const emptyDraft: Draft = { title: "", body: "", tags: "", project: NONE };

/** Written documents with tags and an optional project. */
export const DocsView = observer(function DocsView({ workspaceSlug }: Props) {
  // states
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [projectFilter, setProjectFilter] = useState(NONE);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState<THubDoc | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // hooks
  const { data: currentUser } = useUser();
  const { joinedProjectIds, getPartialProjectById } = useProject();
  const { docs, tags, refresh } = useHubDocs(workspaceSlug, {
    q: query || undefined,
    tag: tag || undefined,
    project: projectFilter === NONE ? undefined : projectFilter,
  });

  const projectOptions = [
    { value: NONE, label: "No project" },
    ...joinedProjectIds.map((id) => ({ value: id, label: getPartialProjectById(id)?.name ?? id })),
  ];
  const filterOptions = [{ value: NONE, label: "All projects" }, ...projectOptions.slice(1)];

  const show = async (doc: THubDoc) => {
    try {
      setOpen(await hubExtraService.getDoc(workspaceSlug, doc.id));
      setDraft(null);
    } catch (error) {
      setToast({ type: "error", title: "Could not open", message: getErrorMessage(error) });
    }
  };

  const save = async () => {
    if (!draft) return;
    setIsSaving(true);
    try {
      const saved = await hubExtraService.saveDoc(
        workspaceSlug,
        {
          title: draft.title,
          body: draft.body,
          tags: draft.tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          project: draft.project === NONE ? null : draft.project,
        },
        draft.id
      );
      await refresh();
      setDraft(null);
      setOpen(saved);
    } catch (error) {
      setToast({ type: "error", title: "Could not save", message: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (doc: THubDoc) => {
    try {
      await hubExtraService.deleteDoc(workspaceSlug, doc.id);
      setOpen(null);
      await refresh();
    } catch (error) {
      setToast({ type: "error", title: "Could not delete", message: getErrorMessage(error) });
    }
  };

  const edit = (doc: THubDoc) =>
    setDraft({
      id: doc.id,
      title: doc.title,
      body: doc.body ?? "",
      tags: doc.tags.join(", "),
      project: doc.project?.id ?? NONE,
    });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle px-4 py-3">
        <h2 className="text-body-md-medium text-primary">Doc Hub</h2>
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          label="New document"
          onClick={() => {
            setOpen(null);
            setDraft(emptyDraft);
          }}
        />
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col gap-2 overflow-y-auto border-r border-subtle p-3">
          <InputField
            type="text"
            size="lg"
            orientation="vertical"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles"
            aria-label="Search titles"
          />
          <div className="[&_button]:min-w-0">
            <SelectField
              size="lg"
              label="Project"
              options={filterOptions}
              value={projectFilter}
              onValueChange={(value) => setProjectFilter(value ?? NONE)}
            />
          </div>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={tag === item}
                  onClick={() => setTag(tag === item ? "" : item)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-caption-sm-regular",
                    tag === item ? "bg-accent-subtle text-accent-primary" : "bg-layer-1 text-secondary"
                  )}
                >
                  #{item}
                </button>
              ))}
            </div>
          ) : null}
          <ul className="flex flex-col gap-1.5">
            {(docs ?? []).length === 0 ? (
              <li className="text-body-xs-regular text-tertiary">No documents for this filter.</li>
            ) : null}
            {(docs ?? []).map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => void show(doc)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-md border px-3 py-2 text-left hover:bg-layer-1",
                    open?.id === doc.id ? "border-accent-strong" : "border-subtle"
                  )}
                >
                  <span className="truncate text-body-sm-medium text-primary">{doc.title}</span>
                  <span className="truncate text-caption-sm-regular text-tertiary">
                    {doc.project ? `${doc.project.identifier} · ` : ""}
                    {doc.author.display_name} · {dateFormat.format(new Date(doc.updated_at))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="min-w-0 flex-1 overflow-y-auto p-4">
          {draft ? (
            <div className="flex max-w-3xl flex-col gap-3">
              <InputField
                type="text"
                size="lg"
                orientation="vertical"
                value={draft.title}
                maxLength={200}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="Title"
                aria-label="Title"
              />
              <TextAreaField
                size="lg"
                label="Document"
                value={draft.body}
                rows={14}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              />
              <InputField
                type="text"
                size="lg"
                orientation="vertical"
                value={draft.tags}
                onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
                placeholder="Tags, separated by commas"
                aria-label="Tags"
              />
              <div className="max-w-xs [&_button]:min-w-0">
                <SelectField
                  size="lg"
                  label="Project"
                  options={projectOptions}
                  value={draft.project}
                  onValueChange={(value) => setDraft({ ...draft, project: value ?? NONE })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="md"
                  stretch="auto"
                  label="Save"
                  loading={isSaving}
                  disabled={!draft.title.trim()}
                  onClick={save}
                />
                <Button variant="secondary" size="md" stretch="auto" label="Cancel" onClick={() => setDraft(null)} />
              </div>
            </div>
          ) : open ? (
            <article className="flex max-w-3xl flex-col gap-3">
              <header className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-h5-medium text-primary">{open.title}</h3>
                  <p className="text-caption-sm-regular text-tertiary">
                    {open.author.display_name} · {dateFormat.format(new Date(open.updated_at))}
                    {open.project ? ` · ${open.project.name}` : ""}
                  </p>
                  {open.tags.length > 0 ? (
                    <p className="text-caption-sm-regular text-accent-primary">
                      {open.tags.map((item) => `#${item}`).join(" ")}
                    </p>
                  ) : null}
                </div>
                {open.author.id === currentUser?.id ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" stretch="auto" label="Edit" onClick={() => edit(open)} />
                    <Button
                      variant="secondary"
                      size="sm"
                      stretch="auto"
                      label="Delete"
                      onClick={() => void remove(open)}
                    />
                  </div>
                ) : null}
              </header>
              <p className="text-body-sm-regular break-words whitespace-pre-wrap text-primary">{open.body}</p>
            </article>
          ) : (
            <p className="text-body-sm-regular text-tertiary">Choose a document, or write a new one.</p>
          )}
        </section>
      </div>
    </div>
  );
});
