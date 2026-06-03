/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useMemo } from "react";
import { observer } from "mobx-react";
import { LayoutList, Search, X } from "lucide-react";
import type { IInstanceDepartment } from "@plane/services";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceDepartment, useInstanceTaskCategory } from "@/hooks/store";

type Props = {
  dept: IInstanceDepartment;
};

export const DepartmentLinkTaskCategories = observer(function DepartmentLinkTaskCategories({ dept }: Props) {
  const { linkTaskCategories, departments } = useInstanceDepartment();
  const { mainCategories, mainCategoryIds } = useInstanceTaskCategory();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Read from observable store so MobX reactivity triggers re-render on update
  const liveDept = departments[dept.id] ?? dept;
  const linkedCount = liveDept.task_category_ids?.length ?? 0;

  const handleOpen = () => {
    setSelectedIds(new Set(liveDept.task_category_ids ?? []));
    setSearch("");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await linkTaskCategories(dept.id, Array.from(selectedIds));
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Task categories updated" });
      setOpen(false);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to update task categories" });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredIds = useMemo(() => {
    const q = search.toLowerCase();
    return mainCategoryIds.filter((id) => {
      const cat = mainCategories[id];
      return cat && cat.name.toLowerCase().includes(q);
    });
  }, [mainCategoryIds, mainCategories, search]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-11 text-tertiary hover:bg-layer-2 hover:text-primary"
        title="Link task categories"
      >
        <LayoutList className="h-3 w-3" />
        {linkedCount > 0 ? (
          <span className="rounded bg-accent-subtle px-1 py-0.5 text-accent-primary">{linkedCount}</span>
        ) : (
          "Link categories"
        )}
      </button>

      {open && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={handleClose}>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="flex max-h-[80vh] w-[480px] max-w-full flex-col rounded-xl border border-subtle bg-layer-1 shadow-raised-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-subtle px-5 pt-5 pb-3">
              <div>
                <p className="text-14 font-semibold text-primary">Link Task Categories</p>
                <p className="mt-0.5 max-w-[320px] truncate text-12 text-tertiary">{dept.name}</p>
              </div>
              <button type="button" onClick={handleClose} className="rounded p-1 text-tertiary hover:bg-layer-2">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-subtle px-4 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-subtle bg-layer-2 px-3 py-1.5">
                <Search className="h-3.5 w-3.5 flex-shrink-0 text-tertiary" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-13 text-primary outline-none placeholder:text-tertiary"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {filteredIds.length === 0 ? (
                <p className="px-3 py-4 text-center text-12 text-tertiary">No categories found</p>
              ) : (
                filteredIds.map((id) => {
                  const cat = mainCategories[id];
                  if (!cat) return null;
                  const checked = selectedIds.has(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleId(id)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-layer-2"
                    >
                      <div
                        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border"
                        style={checked ? { backgroundColor: "#292929", borderColor: "#292929" } : {}}
                      >
                        {checked && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path
                              d="M1.5 5L4 7.5L8.5 2.5"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="flex-1 truncate text-13 text-primary">{cat.name}</span>
                      {!cat.is_active && (
                        <span className="rounded bg-layer-3 px-1.5 py-0.5 text-11 text-tertiary">inactive</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-subtle px-5 py-4">
              <span className="text-12 text-tertiary">{selectedIds.size} selected</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-subtle px-3 py-1.5 text-13 text-secondary hover:bg-layer-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="rounded-lg border border-subtle px-3 py-1.5 text-13 font-medium text-primary hover:bg-layer-2 disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
