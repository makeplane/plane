/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Search } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import type { IWorkspace } from "@plane/types";
import { useWorkspace } from "@/hooks/store";

interface Props {
  isOpen: boolean;
  isExporting: boolean;
  onClose: () => void;
  onExport: (workspaceSlugs?: string[]) => Promise<void>;
}

export const WorkspaceProjectExportDialog = observer(function WorkspaceProjectExportDialog({
  isOpen,
  isExporting,
  onClose,
  onExport,
}: Props) {
  const { workspaces, workspaceIds, fetchAllWorkspaces, loader } = useWorkspace();

  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      void fetchAllWorkspaces();
      setSelectedSlugs(new Set());
      setSearch("");
    }
  }, [isOpen, fetchAllWorkspaces]);

  const workspaceList: IWorkspace[] = workspaceIds.map((id) => workspaces[id]).filter(Boolean);
  const filtered = search.trim()
    ? workspaceList.filter(
        (ws) =>
          ws.name.toLowerCase().includes(search.toLowerCase()) || ws.slug.toLowerCase().includes(search.toLowerCase())
      )
    : workspaceList;

  const allFilteredSelected = filtered.length > 0 && filtered.every((ws) => selectedSlugs.has(ws.slug));

  const toggleWorkspace = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((ws) => next.delete(ws.slug));
      } else {
        filtered.forEach((ws) => next.add(ws.slug));
      }
      return next;
    });
  };

  const isLoading = loader === "init-loader";

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>Export projects</Dialog.Title>
          <div className="mt-4 space-y-3">
            <p className="text-13 text-secondary">
              Select workspaces to export their projects, or use <strong>Export all</strong> to include every workspace.
            </p>

            {/* Search */}
            <div className="flex items-center gap-2 rounded-md border border-subtle bg-layer-2 px-3 py-2">
              <Search className="h-4 w-4 text-tertiary shrink-0" />
              <input
                type="text"
                placeholder="Search workspaces..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-13 outline-none placeholder:text-placeholder"
              />
            </div>

            {/* Select all (visible items) */}
            {filtered.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAllFiltered}
                  className="h-4 w-4 accent-accent-primary"
                />
                <span className="text-13 font-medium">Select all ({filtered.length})</span>
              </label>
            )}

            {/* Workspace list */}
            <div className="max-h-56 overflow-y-auto rounded-md border border-subtle p-1 space-y-0.5">
              {isLoading && <p className="text-13 text-tertiary text-center py-6">Loading workspaces...</p>}
              {!isLoading && filtered.length === 0 && (
                <p className="text-13 text-tertiary text-center py-6">No workspaces found.</p>
              )}
              {!isLoading &&
                filtered.map((ws) => (
                  <label
                    key={ws.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-layer-1-hover cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSlugs.has(ws.slug)}
                      onChange={() => toggleWorkspace(ws.slug)}
                      className="h-4 w-4 accent-accent-primary shrink-0"
                    />
                    <span className="text-13 text-primary flex-1 truncate">{ws.name}</span>
                    <span className="text-13 text-tertiary shrink-0">{ws.slug}</span>
                  </label>
                ))}
            </div>

            {selectedSlugs.size > 0 && (
              <p className="text-13 text-secondary">{selectedSlugs.size} workspace(s) selected</p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" size="lg" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="lg"
              loading={isExporting}
              disabled={selectedSlugs.size === 0 || isExporting}
              onClick={() => void onExport(Array.from(selectedSlugs))}
            >
              Export selected
            </Button>
            <Button
              variant="primary"
              size="lg"
              loading={isExporting}
              disabled={isExporting}
              onClick={() => void onExport()}
            >
              Export all
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
