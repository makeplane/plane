"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@plane/utils";
import type { MatrixColumn } from "../types/matrix.types";

type MatrixColumnsPanelProps = {
  columns: MatrixColumn[];
  defaultVisibleColumnIds: readonly string[];
  onChange: (visibleColumnIds: string[]) => void;
  onClose: () => void;
  visibleColumnIds: readonly string[];
};

const getColumnGroup = (column: MatrixColumn) => column.group ?? column.category ?? column.dimension ?? "Other";

export const MatrixColumnsPanel = ({
  columns,
  defaultVisibleColumnIds,
  onChange,
  onClose,
  visibleColumnIds,
}: MatrixColumnsPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const visibleColumnIdSet = useMemo(() => new Set(visibleColumnIds), [visibleColumnIds]);
  const allColumnIds = useMemo(() => columns.map((column) => column.id), [columns]);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const columnGroups = useMemo(() => {
    const groupsByName = new Map<string, MatrixColumn[]>();

    columns.forEach((column) => {
      const groupName = getColumnGroup(column);
      if (
        normalizedSearchQuery &&
        !`${column.label} ${groupName} ${column.id}`.toLowerCase().includes(normalizedSearchQuery)
      ) {
        return;
      }

      const currentColumns = groupsByName.get(groupName) ?? [];
      currentColumns.push(column);
      groupsByName.set(groupName, currentColumns);
    });

    return Array.from(groupsByName.entries())
      .map(([name, groupColumns]) => ({
        columns: groupColumns.sort((left, right) => left.order - right.order || left.label.localeCompare(right.label)),
        name,
        order: Math.min(...groupColumns.map((column) => column.order)),
      }))
      .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));
  }, [columns, normalizedSearchQuery]);

  const handleToggleColumn = (columnId: string) => {
    const nextColumnIds = new Set(visibleColumnIds);

    if (nextColumnIds.has(columnId)) {
      nextColumnIds.delete(columnId);
    } else {
      nextColumnIds.add(columnId);
    }

    onChange(Array.from(nextColumnIds));
  };

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/50" role="presentation" onClick={onClose}>
      <aside
        aria-label="Columns"
        aria-modal="true"
        className="flex h-full w-full max-w-[340px] flex-col border-l border-custom-border-200 bg-custom-background-100 shadow-xl"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-custom-border-200 px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-custom-text-100">Columns</h3>
              <p className="mt-0.5 text-xs text-custom-text-400">
                {columns.filter((column) => visibleColumnIdSet.has(column.id)).length} of {columns.length} shown
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <label className="flex h-9 items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-90 px-3 text-sm text-custom-text-300">
            <Search className="h-4 w-4" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search columns"
              className="min-w-0 flex-1 bg-transparent text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400"
            />
          </label>
        </div>

        <div className="flex gap-3 border-b border-custom-border-200 px-4 py-2.5">
          <button
            type="button"
            onClick={() => onChange(allColumnIds)}
            className="text-xs font-medium text-custom-primary-100 hover:underline"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-medium text-custom-primary-100 hover:underline"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => onChange(Array.from(defaultVisibleColumnIds))}
            className="text-xs font-medium text-custom-primary-100 hover:underline"
          >
            Reset to default
          </button>
        </div>

        <div className="vertical-scrollbar scrollbar-md min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {columnGroups.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-custom-text-400">No matching columns.</div>
          ) : (
            columnGroups.map((group) => {
              const isCollapsed = Boolean(collapsedGroups[group.name]);

              return (
                <div key={group.name} className="mb-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedGroups((currentValue) => ({
                        ...currentValue,
                        [group.name]: !currentValue[group.name],
                      }))
                    }
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-custom-text-400 transition-colors hover:bg-custom-background-90"
                  >
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isCollapsed && "-rotate-90")} />
                    <span>{group.name}</span>
                  </button>
                  {!isCollapsed && (
                    <div className="flex flex-col">
                      {group.columns.map((column) => (
                        <label
                          key={column.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-7 py-1.5 text-sm text-custom-text-200 transition-colors hover:bg-custom-background-90"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumnIdSet.has(column.id)}
                            onChange={() => handleToggleColumn(column.id)}
                            className="h-4 w-4 rounded border-custom-border-200 accent-custom-primary-100"
                          />
                          <span className="min-w-0 flex-1 truncate" title={column.label}>
                            {column.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};
