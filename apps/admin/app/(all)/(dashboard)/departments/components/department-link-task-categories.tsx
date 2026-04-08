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
  const { linkTaskCategories } = useInstanceDepartment();
  const { mainCategories, mainCategoryIds } = useInstanceTaskCategory();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const linkedCount = dept.task_category_ids?.length ?? 0;

  const handleOpen = () => {
    setSelectedIds(new Set(dept.task_category_ids ?? []));
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
        className="flex items-center gap-1 text-11 text-tertiary hover:text-primary px-1.5 py-0.5 rounded hover:bg-layer-2"
        title="Link task categories"
      >
        <LayoutList className="w-3 h-3" />
        {linkedCount > 0 ? (
          <span className="px-1 py-0.5 rounded bg-accent-subtle text-accent-primary">{linkedCount}</span>
        ) : (
          "Link categories"
        )}
      </button>

      {open && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={handleClose}>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="bg-layer-1 rounded-xl shadow-raised-200 border border-subtle w-[480px] max-w-full flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-subtle">
              <div>
                <p className="text-14 font-semibold text-primary">Link Task Categories</p>
                <p className="text-12 text-tertiary mt-0.5 truncate max-w-[320px]">{dept.name}</p>
              </div>
              <button type="button" onClick={handleClose} className="p-1 rounded hover:bg-layer-2 text-tertiary">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-subtle">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-subtle bg-layer-2">
                <Search className="w-3.5 h-3.5 text-tertiary flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-13 outline-none text-primary placeholder:text-tertiary"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-2 px-2">
              {filteredIds.length === 0 ? (
                <p className="px-3 py-4 text-12 text-tertiary text-center">No categories found</p>
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-layer-2 text-left"
                    >
                      <div
                        className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center"
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
                      <span className="flex-1 text-13 text-primary truncate">{cat.name}</span>
                      {!cat.is_active && (
                        <span className="text-11 px-1.5 py-0.5 rounded bg-layer-3 text-tertiary">inactive</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-subtle">
              <span className="text-12 text-tertiary">{selectedIds.size} selected</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 rounded-lg border border-subtle text-13 text-secondary hover:bg-layer-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded-lg border border-subtle text-13 text-primary font-medium hover:bg-layer-2 disabled:opacity-60"
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
