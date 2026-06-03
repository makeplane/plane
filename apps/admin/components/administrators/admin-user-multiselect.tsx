/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Check, Search, X } from "lucide-react";
import { Input } from "@plane/propel/input";
import type { IAdminUserOption } from "@plane/types";
// hooks
import { useAdminManagement } from "@/hooks/store";

type TProps = {
  selected: IAdminUserOption[];
  onChange: (users: IAdminUserOption[]) => void;
};

/**
 * Searchable multi-select picker of active-staff users for the Add-admin dialog.
 * Type a name, email, or staff ID to filter; pick several users shown as chips.
 *
 * Rendered fully inline (search input + results list) rather than a popover —
 * a portaled dropdown would be inerted by the modal dialog's focus trap.
 * The backend is the authority; already-admin users are never returned.
 */
export const AdminUserMultiselect = observer(({ selected, onChange }: TProps) => {
  const { searchUserCandidates } = useAdminManagement();
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<IAdminUserOption[] | undefined>(undefined);

  // Debounced server-side search; immediate first load.
  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(
      () => {
        setCandidates(undefined);
        void (async () => {
          const users = await searchUserCandidates(search.trim() || undefined);
          if (!cancelled) setCandidates(users);
        })();
      },
      search ? 300 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [search, searchUserCandidates]);

  const selectedIds = useMemo(() => new Set(selected.map((user) => user.id)), [selected]);

  const toggle = (user: IAdminUserOption) =>
    selectedIds.has(user.id) ? onChange(selected.filter((u) => u.id !== user.id)) : onChange([...selected, user]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or staff ID…"
          className="w-full bg-layer-2 pl-8"
        />
      </div>

      <div className="max-h-52 overflow-auto rounded-md border-[0.5px] border-subtle">
        {candidates === undefined ? (
          <p className="px-3 py-2 text-13 text-placeholder">Searching…</p>
        ) : candidates.length === 0 ? (
          <p className="px-3 py-2 text-13 text-placeholder">No matching staff found</p>
        ) : (
          <ul>
            {candidates.map((candidate) => {
              const checked = selectedIds.has(candidate.id);
              return (
                <li key={candidate.id}>
                  <button
                    type="button"
                    onClick={() => toggle(candidate)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-13 text-primary hover:bg-layer-1-hover"
                  >
                    <Check
                      className={`h-4 w-4 shrink-0 text-accent-primary ${checked ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="truncate">
                      {candidate.display_name} · {candidate.staff_id}{" "}
                      <span className="text-tertiary">({candidate.email})</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((user) => (
            <li key={user.id} className="flex items-center gap-1 rounded-md bg-layer-1 px-2 py-1 text-13 text-primary">
              <span className="truncate">
                {user.display_name} · {user.staff_id}
              </span>
              <button
                type="button"
                onClick={() => toggle(user)}
                aria-label={`Remove ${user.display_name}`}
                className="rounded-sm text-tertiary hover:text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
