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
        className="w-80 max-w-full rounded-xl border border-subtle bg-layer-1 p-5 shadow-raised-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-14 font-semibold text-primary">Managers added as Admin</p>
            <p className="mt-0.5 text-12 text-tertiary">{workspaceName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-tertiary hover:bg-layer-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="max-h-60 space-y-2 overflow-auto">
          {managers.map((m) => (
            <li key={m.id} className="flex flex-col rounded bg-layer-2 px-2 py-1.5">
              <span className="text-13 font-medium text-primary">{m.display_name}</span>
              <span className="text-11 text-tertiary">{m.email}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="bg-custom-primary-100 hover:bg-custom-primary-200 mt-4 w-full rounded-lg py-1.5 text-13 font-medium text-white"
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
          <span className="max-w-[120px] truncate rounded bg-success-subtle px-1.5 py-0.5 text-11 text-success-primary">
            {dept.linked_workspace_detail.name}
          </span>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleUnlink()}
            className="rounded p-0.5 text-tertiary hover:text-danger-primary"
            title="Unlink workspace"
          >
            <Unlink className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div ref={ref} className="relative">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-11 text-tertiary hover:bg-layer-2 hover:text-primary"
          >
            <Link2 className="h-3 w-3" />
            Link workspace
            <ChevronDown className="h-3 w-3" />
          </button>
          {open && (
            <div className="absolute top-full right-0 z-50 mt-1 max-h-48 w-56 overflow-auto rounded-lg border border-subtle bg-layer-1 py-1 shadow-raised-100">
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
                      className="w-full truncate px-3 py-2 text-left text-13 hover:bg-layer-2"
                    >
                      {ws.name}
                      <span className="ml-1 text-tertiary">({ws.slug})</span>
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
