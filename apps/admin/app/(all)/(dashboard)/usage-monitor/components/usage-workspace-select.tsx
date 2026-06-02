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
import { useUsageMonitor } from "@/hooks/store/use-usage-monitor";
import { useWorkspace } from "@/hooks/store/use-workspace";

const triggerClass =
  "bg-layer-2 border-[0.5px] border-subtle rounded-md px-2 py-1.5 text-13 text-primary flex items-center justify-between gap-2 min-w-44";

/**
 * Searchable workspace picker for the usage-monitor filter bar.
 *
 * Search runs server-side (name__icontains) via the workspace store, which
 * resets its list on each new query — so the selected workspace can drop out of
 * `workspaces`. We cache the chosen name locally to keep the trigger label and
 * filter selection stable regardless of the current search results.
 */
export const UsageWorkspaceSelect = observer(() => {
  const { filters, setFilters } = useUsageMonitor();
  const { workspaceIds, workspaces, fetchWorkspaces, loader } = useWorkspace();
  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState<string | undefined>(undefined);

  // Debounced server-side search; fires immediately on mount (empty query) to
  // load the first page, then waits while the admin keeps typing.
  useEffect(() => {
    const handle = setTimeout(() => void fetchWorkspaces(search), search ? 300 : 0);
    return () => clearTimeout(handle);
  }, [search, fetchWorkspaces]);

  const handleChange = (value: string | string[]) => {
    const id = (Array.isArray(value) ? value[0] : value) || undefined;
    setSelectedName(id ? (workspaces[id]?.name ?? selectedName) : undefined);
    setFilters({ workspace_id: id });
  };

  const triggerLabel = filters.workspace_id
    ? (selectedName ?? workspaces[filters.workspace_id]?.name ?? "Selected workspace")
    : "All workspaces";

  // While a (debounced) server search is in flight the stale list is filtered
  // client-side and can momentarily render empty — show a fetching hint instead.
  const isFetching = loader === "init-loader" || loader === "mutation";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-11 text-tertiary">Workspace</span>
      <Combobox value={filters.workspace_id ?? ""} onValueChange={handleChange}>
        <Combobox.Button className={triggerClass} aria-label="Workspace">
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-tertiary" />
        </Combobox.Button>
        <Combobox.Options
          showSearch
          searchPlaceholder="Search workspace…"
          searchQuery={search}
          onSearchQueryChange={setSearch}
          emptyMessage={isFetching ? "Searching…" : "No workspaces found"}
          className="w-64"
        >
          <Combobox.Option value="" className="flex items-center gap-2">
            {!filters.workspace_id && <Check className="h-4 w-4 shrink-0 text-accent-primary" />}
            <span>All workspaces</span>
          </Combobox.Option>
          {workspaceIds.map((id) => (
            <Combobox.Option key={id} value={id} className="flex items-center gap-2">
              {filters.workspace_id === id && <Check className="h-4 w-4 shrink-0 text-accent-primary" />}
              <span className="truncate">{workspaces[id]?.name ?? id}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    </div>
  );
});
