/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import { CheckboxField } from "@makeplane/propel/components/checkbox-field";
import { InputField } from "@makeplane/propel/components/input-field";
import { setToast } from "@plane/blocks/toast";
import type { THubSecret, THubSecretLog } from "@plane/types";
// hooks
import { hubExtraService, useHubPeople, useHubSecrets } from "@/hooks/team-ops/use-hub";
// local imports
import { getErrorMessage } from "../calendar/error-message";

type Props = { workspaceSlug: string };

/** How long a revealed value stays on screen. */
const SHOW_SECONDS = 20;
const timeFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const ACTION: Record<THubSecretLog["action"], string> = {
  CREATE: "created it",
  REVEAL: "read the value",
  UPDATE: "changed it",
  GRANT: "gave access to",
  REVOKE: "took access from",
};

function PeoplePicker({
  people,
  selected,
  onChange,
}: {
  people: { id: string; display_name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <fieldset className="flex flex-wrap gap-x-4 gap-y-1">
      <legend className="mb-1 text-body-xs-medium text-secondary">Who may read it (you always can)</legend>
      {people.map((person) => (
        <CheckboxField
          key={person.id}
          size="lg"
          label={person.display_name}
          checked={selected.includes(person.id)}
          onCheckedChange={() =>
            onChange(
              selected.includes(person.id) ? selected.filter((id) => id !== person.id) : [...selected, person.id]
            )
          }
        />
      ))}
    </fieldset>
  );
}

function SecretCard({
  workspaceSlug,
  secret,
  people,
  onChanged,
}: {
  workspaceSlug: string;
  secret: THubSecret;
  people: { id: string; display_name: string }[];
  onChanged: () => Promise<unknown>;
}) {
  const [value, setValue] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const [sharing, setSharing] = useState<string[] | null>(null);
  const [log, setLog] = useState<THubSecretLog[] | null>(null);
  const [newValue, setNewValue] = useState<string | null>(null);

  // The value disappears again after a short while; it is never kept anywhere else.
  useEffect(() => {
    if (value === null) return;
    setLeft(SHOW_SECONDS);
    const interval = setInterval(() => setLeft((current) => current - 1), 1000);
    const timeout = setTimeout(() => setValue(null), SHOW_SECONDS * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [value]);

  const guard = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (error) {
      setToast({ type: "error", title: "Something went wrong", message: getErrorMessage(error) });
    }
  };

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-subtle bg-surface-1 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-body-sm-medium text-primary">{secret.name}</p>
          <p className="text-caption-sm-regular text-tertiary">
            {secret.is_publisher ? "Published by you" : `Shared by ${secret.publisher.display_name}`}
            {secret.project ? ` · ${secret.project.name}` : ""}
            {secret.is_publisher ? ` · ${secret.shared_with?.length ?? 0} other person(s) can read it` : ""}
          </p>
          {secret.description ? <p className="text-body-xs-regular text-secondary">{secret.description}</p> : null}
        </div>
        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          label={value === null ? "Reveal" : "Hide"}
          onClick={() =>
            value === null
              ? void guard(async () => setValue(await hubExtraService.revealSecret(workspaceSlug, secret.id)))
              : setValue(null)
          }
        />
      </div>

      {value !== null ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-layer-1 p-2">
          <code className="font-mono min-w-0 flex-1 text-body-sm-regular break-all text-primary select-all">
            {value}
          </code>
          <button
            type="button"
            className="text-body-xs-medium text-accent-primary hover:underline"
            onClick={() => void navigator.clipboard?.writeText(value)}
          >
            Copy
          </button>
          <span className="text-caption-sm-regular text-tertiary">hides in {Math.max(0, left)}s</span>
        </div>
      ) : null}

      {secret.is_publisher ? (
        <div className="flex flex-wrap gap-3 text-body-xs-medium">
          <button
            type="button"
            className="text-accent-primary hover:underline"
            onClick={() => setSharing(sharing ? null : (secret.shared_with ?? []))}
          >
            Sharing
          </button>
          <button
            type="button"
            className="text-accent-primary hover:underline"
            onClick={() =>
              void guard(async () => setLog(log ? null : await hubExtraService.getSecretLog(workspaceSlug, secret.id)))
            }
          >
            Activity
          </button>
          <button
            type="button"
            className="text-accent-primary hover:underline"
            onClick={() => setNewValue(newValue === null ? "" : null)}
          >
            Change value
          </button>
          <button
            type="button"
            className="text-danger-primary hover:underline"
            onClick={() =>
              void guard(async () => {
                await hubExtraService.deleteSecret(workspaceSlug, secret.id);
                await onChanged();
              })
            }
          >
            Delete
          </button>
        </div>
      ) : null}

      {sharing ? (
        <div className="flex flex-col gap-2 border-t border-subtle pt-2">
          <PeoplePicker people={people} selected={sharing} onChange={setSharing} />
          <div>
            <Button
              variant="primary"
              size="sm"
              stretch="auto"
              label="Save access"
              onClick={() =>
                void guard(async () => {
                  await hubExtraService.setSecretAccess(workspaceSlug, secret.id, sharing);
                  await onChanged();
                  setSharing(null);
                })
              }
            />
          </div>
        </div>
      ) : null}

      {newValue !== null ? (
        <div className="flex flex-wrap items-end gap-2 border-t border-subtle pt-2">
          <div className="min-w-64 flex-1">
            <InputField
              type="password"
              size="lg"
              orientation="vertical"
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              placeholder="New value"
              aria-label="New value"
              autoComplete="off"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label="Save"
            disabled={!newValue}
            onClick={() =>
              void guard(async () => {
                await hubExtraService.updateSecret(workspaceSlug, secret.id, { value: newValue });
                setNewValue(null);
                await onChanged();
              })
            }
          />
        </div>
      ) : null}

      {log ? (
        <ul className="flex flex-col gap-0.5 border-t border-subtle pt-2 text-caption-sm-regular text-secondary">
          {log.map((row, index) => (
            <li key={`${row.at}-${index}`}>
              {timeFormat.format(new Date(row.at))} · {row.user.display_name} {ACTION[row.action]}
              {row.target ? ` ${row.target.display_name}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** Passwords and keys. Only the publisher and the people they chose can read a value; nobody else, admins included. */
export const SecretsView = observer(function SecretsView({ workspaceSlug }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const { secrets, refresh } = useHubSecrets(workspaceSlug);
  const { people } = useHubPeople(workspaceSlug);

  const create = async () => {
    try {
      await hubExtraService.createSecret(workspaceSlug, { name, description, value, users });
      setIsCreating(false);
      setName("");
      setDescription("");
      setValue("");
      setUsers([]);
      await refresh();
    } catch (error) {
      setToast({ type: "error", title: "Could not save", message: getErrorMessage(error) });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle px-4 py-3">
        <div>
          <h2 className="text-body-md-medium text-primary">Secrets</h2>
          <p className="text-caption-sm-regular text-tertiary">
            Values are stored encrypted and are never shown in lists. Only you and the people you choose can read them,
            and every read is logged.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          label="New secret"
          onClick={() => setIsCreating(!isCreating)}
        />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isCreating ? (
          <div className="mb-4 flex max-w-2xl flex-col gap-3 rounded-lg border border-accent-strong bg-surface-1 p-4">
            <InputField
              type="text"
              size="lg"
              orientation="vertical"
              value={name}
              maxLength={200}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name, for example Production database"
              aria-label="Name"
            />
            <InputField
              type="text"
              size="lg"
              orientation="vertical"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What it is for (optional)"
              aria-label="Description"
            />
            <InputField
              type="password"
              size="lg"
              orientation="vertical"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="The secret value"
              aria-label="Value"
              autoComplete="off"
            />
            <PeoplePicker people={people ?? []} selected={users} onChange={setUsers} />
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="md"
                stretch="auto"
                label="Save secret"
                disabled={!name.trim() || !value}
                onClick={create}
              />
              <Button
                variant="secondary"
                size="md"
                stretch="auto"
                label="Cancel"
                onClick={() => setIsCreating(false)}
              />
            </div>
          </div>
        ) : null}
        <ul className="flex max-w-3xl flex-col gap-3">
          {(secrets ?? []).length === 0 ? (
            <li className="text-body-sm-regular text-tertiary">
              No secrets here. Secrets you publish, and secrets others share with you, appear in this list.
            </li>
          ) : null}
          {(secrets ?? []).map((secret) => (
            <SecretCard
              key={secret.id}
              workspaceSlug={workspaceSlug}
              secret={secret}
              people={people ?? []}
              onChanged={refresh}
            />
          ))}
        </ul>
      </div>
    </div>
  );
});
