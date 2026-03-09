/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Link2, Unlink } from "lucide-react";
import type { IInstanceDepartment } from "@plane/services";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceDepartment, useWorkspace } from "@/hooks/store";

type Props = {
  dept: IInstanceDepartment;
};

export const DepartmentLinkWorkspace = observer(function DepartmentLinkWorkspace({ dept }: Props) {
  const { linkWorkspace, unlinkWorkspace } = useInstanceDepartment();
  const { workspaces, workspaceIds, fetchAllWorkspaces, loader } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && workspaceIds.length === 0) {
      void fetchAllWorkspaces();
    }
  }, [open, workspaceIds.length, fetchAllWorkspaces]);

  // Close on outside click
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
      await linkWorkspace(dept.id, workspaceId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Workspace linked",
        message: dept.staff_count > 20 ? "Staff are being added to workspace in the background." : undefined,
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to link workspace" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async () => {
    setIsSubmitting(true);
    try {
      await unlinkWorkspace(dept.id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Workspace unlinked" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to unlink workspace" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (dept.linked_workspace_detail) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-11 px-1.5 py-0.5 rounded bg-success-subtle text-color-success-primary truncate max-w-[120px]">
          {dept.linked_workspace_detail.name}
        </span>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleUnlink()}
          className="text-tertiary hover:text-color-danger-primary p-0.5 rounded"
          title="Unlink workspace"
        >
          <Unlink className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
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
  );
});
