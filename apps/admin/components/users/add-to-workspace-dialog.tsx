/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Check, Search } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { Loader } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useInstanceUser, useWorkspace } from "@/hooks/store";

const ROLES = [
  { value: 20, label: "Admin" },
  { value: 15, label: "Member" },
  { value: 5, label: "Guest" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  existingWorkspaceIds: string[];
};

export const AddToWorkspaceDialog = observer(function AddToWorkspaceDialog({
  open,
  onClose,
  userId,
  existingWorkspaceIds,
}: Props) {
  const { addUserToWorkspace } = useInstanceUser();
  const { workspaces, workspaceIds, fetchAllWorkspaces, loader } = useWorkspace();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRole, setSelectedRole] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all workspaces when dialog opens
  useEffect(() => {
    if (open) {
      void fetchAllWorkspaces();
    }
  }, [open, fetchAllWorkspaces]);

  const isLoading = loader === "init-loader";

  const availableWorkspaces = useMemo(
    () =>
      workspaceIds
        .filter((id) => !existingWorkspaceIds.includes(id))
        .map((id) => workspaces[id])
        .filter(Boolean),
    [workspaceIds, existingWorkspaceIds, workspaces]
  );

  // Filter by search query (name or slug)
  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return availableWorkspaces;
    const q = searchQuery.toLowerCase();
    return availableWorkspaces.filter((ws) => ws.name.toLowerCase().includes(q) || ws.slug.toLowerCase().includes(q));
  }, [availableWorkspaces, searchQuery]);

  // Toggle single workspace selection
  const toggleWorkspace = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select/deselect all visible (filtered) workspaces
  const allFilteredSelected = filteredWorkspaces.length > 0 && filteredWorkspaces.every((ws) => selectedIds.has(ws.id));
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredWorkspaces.forEach((ws) => next.delete(ws.id));
      } else {
        filteredWorkspaces.forEach((ws) => next.add(ws.id));
      }
      return next;
    });
  };

  const handleClose = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedRole(15);
    setSearchQuery("");
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;
    for (const wsId of ids) {
      try {
        await addUserToWorkspace(userId, wsId, selectedRole);
        successCount++;
      } catch {
        failCount++;
      }
    }
    if (successCount > 0) {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: `Added to ${successCount} workspace${successCount > 1 ? "s" : ""}`,
      });
    }
    if (failCount > 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: `Failed to add to ${failCount} workspace${failCount > 1 ? "s" : ""}`,
      });
    }
    setIsSubmitting(false);
    handleClose();
  }, [selectedIds, addUserToWorkspace, userId, selectedRole, handleClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>Add to Workspace</Dialog.Title>
          <div className="mt-4 space-y-4">
            {/* Workspace multi-select with search */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="workspace-search" className="block text-13 font-medium text-primary">
                  Workspace
                </label>
                {selectedIds.size > 0 && <span className="text-11 text-accent">{selectedIds.size} selected</span>}
              </div>
              {isLoading ? (
                <Loader className="space-y-2">
                  <Loader.Item height="36px" width="100%" />
                </Loader>
              ) : availableWorkspaces.length === 0 ? (
                <p className="text-11 text-tertiary">User is already a member of all workspaces.</p>
              ) : (
                <div className="rounded-md border border-subtle">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tertiary" />
                    <input
                      id="workspace-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search workspace..."
                      className="w-full rounded-t-md border-b border-subtle bg-layer-2 py-2 pl-8 pr-3 text-13 outline-none placeholder:text-tertiary"
                    />
                  </div>
                  {/* Select all toggle */}
                  {filteredWorkspaces.length > 1 && (
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="flex w-full items-center gap-2 border-b border-subtle px-3 py-1.5 text-left text-11 font-medium text-accent hover:bg-layer-3"
                    >
                      <span
                        className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                          allFilteredSelected ? "border-accent bg-accent text-white" : "border-subtle"
                        }`}
                      >
                        {allFilteredSelected && <Check className="h-2.5 w-2.5" />}
                      </span>
                      {allFilteredSelected ? "Deselect all" : `Select all (${filteredWorkspaces.length})`}
                    </button>
                  )}
                  {/* Workspace list */}
                  <div className="max-h-48 overflow-auto">
                    {filteredWorkspaces.length === 0 ? (
                      <p className="px-3 py-2 text-13 text-tertiary">No workspace found</p>
                    ) : (
                      filteredWorkspaces.map((ws) => {
                        const isSelected = selectedIds.has(ws.id);
                        return (
                          <button
                            key={ws.id}
                            type="button"
                            onClick={() => toggleWorkspace(ws.id)}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-13 transition-colors hover:bg-layer-3 ${
                              isSelected ? "bg-layer-3 text-primary" : "text-secondary"
                            }`}
                          >
                            <span
                              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                                isSelected ? "border-accent bg-accent text-white" : "border-subtle"
                              }`}
                            >
                              {isSelected && <Check className="h-2.5 w-2.5" />}
                            </span>
                            <span className="flex-1 truncate">
                              {ws.name} <span className="text-tertiary">({ws.slug})</span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Role selector (applies to all selected workspaces) */}
            <div className="space-y-1">
              <label htmlFor="role-select" className="block text-13 font-medium text-primary">
                Role <span className="text-tertiary font-normal">(applies to all selected)</span>
              </label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(Number(e.target.value))}
                className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13"
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleSubmit()}
              loading={isSubmitting}
              disabled={selectedIds.size === 0}
            >
              {selectedIds.size > 1 ? `Add to ${selectedIds.size} workspaces` : "Add"}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
