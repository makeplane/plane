/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Combobox } from "@plane/propel/combobox";
// hooks
import { useWorkspace } from "@/hooks/store";

const triggerClass =
  "bg-layer-2 border-[0.5px] border-subtle rounded-md px-3 py-2 text-13 text-primary flex items-center justify-between gap-2 w-full";

type TProps = {
  value: string | undefined;
  onChange: (ownerId: string) => void;
};

/**
 * Searchable owner picker for the create-workspace form.
 *
 * Defaults to the General Director once owner options load; the backend is
 * the authority — it re-validates owner_id and falls back to the GD itself.
 * Candidates can be empty when the caller lacks staff-directory access; the
 * picker then locks to the GD (or asks for a super-admin when no GD resolves).
 */
export const WorkspaceOwnerSelect = observer(({ value, onChange }: TProps) => {
  const { ownerOptions, fetchOwnerOptions } = useWorkspace();
  const [search, setSearch] = useState("");

  // Debounced server-side staff search; immediate first load.
  useEffect(() => {
    const handle = setTimeout(() => void fetchOwnerOptions(search), search ? 300 : 0);
    return () => clearTimeout(handle);
  }, [search, fetchOwnerOptions]);

  const defaultOwner = ownerOptions?.default_owner ?? null;
  const candidates = ownerOptions?.candidates ?? [];

  // Preselect the GD once options arrive and nothing is chosen yet.
  useEffect(() => {
    if (!value && defaultOwner) onChange(defaultOwner.id);
  }, [value, defaultOwner, onChange]);

  const selected = candidates.find((c) => c.id === value) ?? (defaultOwner?.id === value ? defaultOwner : null);
  const pickerLocked = candidates.length === 0;

  // Not yet loaded (or fetch failed): don't masquerade as "no GD found".
  if (ownerOptions === undefined) {
    return (
      <div className={triggerClass} aria-label="Workspace owner">
        <span className="text-placeholder">Loading owners…</span>
      </div>
    );
  }

  if (pickerLocked) {
    return (
      <div className={triggerClass} aria-label="Workspace owner">
        {defaultOwner ? (
          <span className="truncate">
            {defaultOwner.display_name} ({defaultOwner.email})
          </span>
        ) : (
          <span className="text-danger-primary">
            Owner required — no General Director found. Ask a super-admin to fix staff data.
          </span>
        )}
      </div>
    );
  }

  return (
    <Combobox value={value ?? ""} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}>
      <Combobox.Button className={triggerClass} aria-label="Workspace owner">
        <span className="truncate">
          {selected ? `${selected.display_name} (${selected.email})` : "Select an owner"}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-tertiary" />
      </Combobox.Button>
      <Combobox.Options
        showSearch
        searchPlaceholder="Search staff…"
        searchQuery={search}
        onSearchQueryChange={setSearch}
        emptyMessage="No staff found"
        className="w-80"
      >
        {candidates.map((candidate) => (
          <Combobox.Option key={candidate.id} value={candidate.id} className="flex items-center gap-2">
            {value === candidate.id && <Check className="h-4 w-4 shrink-0 text-accent-primary" />}
            <span className="truncate">
              {candidate.display_name} ({candidate.email})
            </span>
          </Combobox.Option>
        ))}
      </Combobox.Options>
    </Combobox>
  );
});
