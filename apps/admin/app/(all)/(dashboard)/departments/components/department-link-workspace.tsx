/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Link2, Unlink, X } from "lucide-react";
import type { IInstanceDepartment, IManagerAdded } from "@plane/services";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceDepartment, useWorkspace } from "@/hooks/store";

/** Extract a readable string from DRF error responses (object, array, or string). */
function parseApiError(error: unknown): string {
  if (!error || typeof error !== "object") return String(error ?? "Unknown error");
  const obj = error as Record<string, unknown>;
  // DRF detail / error keys
  if (typeof obj.detail === "string") return obj.detail;
  if (typeof obj.error === "string") return obj.error;
  // Field-level validation: { field: ["msg", ...] }
  const entries = Object.entries(obj);
  if (entries.length > 0) {
    return entries
      .map(([field, msgs]) => {
        const msg = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
        return `${field}: ${msg}`;
      })
      .join(" | ");
  }
  return "Unknown error";
}

type Props = {
  dept: IInstanceDepartment;
};

/** Modal showing which managers were added as Admin after workspace linking. */
function ManagersAddedModal({
  managers,
  workspaceName,
  onClose,
}: {
  managers: IManagerAdded[];
  workspaceName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-layer-1 rounded-xl shadow-raised-200 border border-subtle w-80 max-w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-14 font-semibold text-primary">Managers added as Admin</p>
            <p className="text-12 text-tertiary mt-0.5">{workspaceName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-layer-2 text-tertiary">
            <X className="w-4 h-4" />
          </button>
        </div>
        <ul className="space-y-2 max-h-60 overflow-auto">
          {managers.map((m) => (
            <li key={m.id} className="flex flex-col px-2 py-1.5 rounded bg-layer-2">
              <span className="text-13 font-medium text-primary">{m.display_name}</span>
              <span className="text-11 text-tertiary">{m.email}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-1.5 rounded-lg bg-custom-primary-100 text-white text-13 font-medium hover:bg-custom-primary-200"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export const DepartmentLinkWorkspace = observer(function DepartmentLinkWorkspace({ dept }: Props) {
  const { linkWorkspace, unlinkWorkspace, fetchTree } = useInstanceDepartment();
  const { workspaces, workspaceIds, fetchAllWorkspaces, loader } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managersAdded, setManagersAdded] = useState<{ managers: IManagerAdded[]; workspaceName: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && workspaceIds.length === 0) {
      void fetchAllWorkspaces();
    }
  }, [open, workspaceIds.length, fetchAllWorkspaces]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleLink = async (workspaceId: string) => {
    setIsSubmitting(true);
    setOpen(false);
    try {
      const result = await linkWorkspace(dept.id, workspaceId);
      await fetchTree();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Workspace linked",
        message: dept.staff_count > 20 ? "Staff are being added to workspace in the background." : undefined,
      });
      // Show popup if any managers were added as Admin
      if (result?.managers_added?.length > 0) {
        const wsName = workspaces[workspaceId]?.name ?? "workspace";
        setManagersAdded({ managers: result.managers_added, workspaceName: wsName });
      }
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to link workspace", message: parseApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async () => {
    setIsSubmitting(true);
    try {
      await unlinkWorkspace(dept.id);
      await fetchTree();
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Workspace unlinked" });
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to unlink workspace", message: parseApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {managersAdded && (
        <ManagersAddedModal
          managers={managersAdded.managers}
          workspaceName={managersAdded.workspaceName}
          onClose={() => setManagersAdded(null)}
        />
      )}

      {dept.linked_workspace_detail ? (
        <div className="flex items-center gap-1">
          <span className="text-11 px-1.5 py-0.5 rounded bg-success-subtle text-success-primary truncate max-w-[120px]">
            {dept.linked_workspace_detail.name}
          </span>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleUnlink()}
            className="text-tertiary hover:text-danger-primary p-0.5 rounded"
            title="Unlink workspace"
          >
            <Unlink className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div ref={ref} className="relative">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-11 text-tertiary hover:text-primary px-1.5 py-0.5 rounded hover:bg-layer-2"
          >
            <Link2 className="w-3 h-3" />
            Link workspace
            <ChevronDown className="w-3 h-3" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-subtle bg-layer-1 shadow-raised-100 py-1 max-h-48 overflow-auto">
              {loader === "init-loader" ? (
                <p className="px-3 py-2 text-12 text-tertiary">Loading...</p>
              ) : workspaceIds.length === 0 ? (
                <p className="px-3 py-2 text-12 text-tertiary">No workspaces found</p>
              ) : (
                workspaceIds.map((id) => {
                  const ws = workspaces[id];
                  if (!ws) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => void handleLink(id)}
                      className="w-full px-3 py-2 text-left text-13 hover:bg-layer-2 truncate"
                    >
                      {ws.name}
                      <span className="text-tertiary ml-1">({ws.slug})</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
});
