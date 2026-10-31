/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { CheckboxField } from "@makeplane/propel/components/checkbox-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { FILE_ACCEPT, MAX_FILES, MAX_FILE_MB, fileLimitError, finishBlocker } from "@plane/services";
import type { TFinishWorkPayload, THubPerson, TOpsTeam } from "@plane/types";

type Props = {
  /** What is being finished, e.g. `WD-1 Fix login`, and how long it took. */
  title: string;
  elapsedLabel: string;
  teams: TOpsTeam[];
  /** Colleagues who can be tagged one by one. */
  people: THubPerson[];
  onFinish: (payload: TFinishWorkPayload) => Promise<void>;
  onCancel: () => void;
};

/** The report that closes a piece of work: what was done, the document (or its absence) and hand-offs. */
export function FinishWorkPanel({ title, elapsedLabel, teams, people, onFinish, onCancel }: Props) {
  // states
  const [summary, setSummary] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [noDocument, setNoDocument] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [needsAttention, setNeedsAttention] = useState(false);
  const [attentionMessage, setAttentionMessage] = useState("");
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [fileError, setFileError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const hasDocument = documentText.trim().length > 0 || files.length > 0;
  const blocker = finishBlocker({
    summary,
    documentText,
    noDocument,
    fileCount: files.length,
    needsAttention,
    attentionMessage,
  });

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list)];
    const problem = fileLimitError(next);
    if (problem) return setFileError(problem);
    setFileError("");
    setFiles(next);
    if (input.current) input.current.value = "";
  };

  const submit = async () => {
    if (blocker) return;
    setIsSaving(true);
    try {
      await onFinish({
        summary,
        document_text: documentText,
        no_document: noDocument && !hasDocument,
        attention_message: needsAttention ? attentionMessage : "",
        attention_teams: needsAttention ? teamIds : [],
        attention_users: needsAttention ? userIds : [],
        files,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTeam = (id: string) =>
    setTeamIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

  return (
    <section
      aria-label="Finish work"
      className="flex flex-col gap-4 rounded-lg border border-accent-strong bg-surface-1 p-4"
    >
      <header>
        <h2 className="text-h5-medium text-primary">Finish work</h2>
        <p className="text-body-sm-regular text-secondary">
          {title} · <span className="tabular-nums">{elapsedLabel}</span>
        </p>
      </header>

      <TextAreaField
        size="lg"
        label="What did you do? (required)"
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        rows={3}
        maxLength={5000}
        placeholder="A short report of the work. It is added to today's daily report."
      />

      <div className="flex flex-col gap-2 rounded-md border border-subtle p-3">
        <p className="text-body-sm-medium text-primary">Document</p>
        <TextAreaField
          size="lg"
          label="Notes or link (optional)"
          value={documentText}
          onChange={(event) => setDocumentText(event.target.value)}
          rows={3}
          maxLength={20000}
          placeholder="Paste the document, notes or a link."
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={input}
            type="file"
            multiple
            accept={FILE_ACCEPT}
            className="sr-only"
            id="finish-work-files"
            onChange={(event) => addFiles(event.target.files)}
          />
          <label
            htmlFor="finish-work-files"
            className="cursor-pointer rounded-md border border-subtle px-3 py-1.5 text-body-xs-medium text-secondary hover:bg-layer-1"
          >
            Attach files
          </label>
          <span className="text-caption-sm-regular text-tertiary">
            Images, PDF, text, CSV, Word, Excel, PowerPoint. Up to {MAX_FILES} files of {MAX_FILE_MB} MB.
          </span>
        </div>
        {fileError ? (
          <p role="alert" className="text-body-xs-regular text-danger-primary">
            {fileError}
          </p>
        ) : null}
        {files.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-2 text-body-xs-regular"
              >
                <span className="truncate text-primary">{file.name}</span>
                <button
                  type="button"
                  className="shrink-0 text-accent-primary hover:underline"
                  onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {!hasDocument ? (
          <CheckboxField
            size="lg"
            label="There is no document for this work"
            checked={noDocument}
            onCheckedChange={(checked) => setNoDocument(Boolean(checked))}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-subtle p-3">
        <CheckboxField
          size="lg"
          label="Needs attention from other teams"
          checked={needsAttention}
          onCheckedChange={(checked) => setNeedsAttention(Boolean(checked))}
        />
        {needsAttention ? (
          <>
            <TextAreaField
              size="lg"
              label="What should they look at?"
              value={attentionMessage}
              onChange={(event) => setAttentionMessage(event.target.value)}
              rows={2}
              maxLength={4000}
              placeholder="It is posted in the Hub, in the project channel and in the channel of each team you choose."
            />
            {teams.length > 0 ? (
              <fieldset className="flex flex-wrap gap-x-4 gap-y-1">
                <legend className="mb-1 text-body-xs-medium text-secondary">Tell these teams</legend>
                {teams.map((team) => (
                  <CheckboxField
                    key={team.id}
                    size="lg"
                    label={team.name}
                    checked={teamIds.includes(team.id)}
                    onCheckedChange={() => toggleTeam(team.id)}
                  />
                ))}
              </fieldset>
            ) : null}
            {people.length > 0 ? (
              <fieldset className="flex flex-wrap gap-x-4 gap-y-1">
                <legend className="mb-1 text-body-xs-medium text-secondary">Tell these people</legend>
                {people.map((person) => (
                  <CheckboxField
                    key={person.id}
                    size="lg"
                    label={person.display_name}
                    checked={userIds.includes(person.id)}
                    onCheckedChange={() =>
                      setUserIds((current) =>
                        current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id]
                      )
                    }
                  />
                ))}
              </fieldset>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-body-xs-regular text-tertiary" aria-live="polite">
          {blocker ?? "Ready to finish."}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            stretch="auto"
            label="Keep working"
            onClick={onCancel}
            disabled={isSaving}
          />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label="Finish work"
            loading={isSaving}
            disabled={blocker !== null}
            onClick={submit}
          />
        </div>
      </div>
    </section>
  );
}
