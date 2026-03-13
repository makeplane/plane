/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IInstanceUserWorkspace } from "@plane/services";
import { cn } from "@plane/utils";

const ROLE_LABELS: Record<number, { label: string; className: string }> = {
  20: { label: "Admin", className: "bg-accent-subtle text-accent-primary" },
  15: { label: "Member", className: "bg-surface-2 text-secondary" },
  5: { label: "Guest", className: "bg-layer-2 text-tertiary" },
};

type Props = {
  workspaces: IInstanceUserWorkspace[];
};

export function UserWorkspaceList({ workspaces }: Props) {
  if (workspaces.length === 0) {
    return <div className="text-center py-8 text-tertiary">Not a member of any workspace.</div>;
  }

  return (
    <div className="border border-subtle rounded-lg overflow-hidden">
      <table className="w-full text-13">
        <thead>
          <tr className="bg-layer-1 text-secondary text-left">
            <th className="px-4 py-2.5 font-medium">Workspace</th>
            <th className="px-4 py-2.5 font-medium">Slug</th>
            <th className="px-4 py-2.5 font-medium">Role</th>
            <th className="px-4 py-2.5 font-medium">Joined</th>
          </tr>
        </thead>
        <tbody>
          {workspaces.map((ws) => {
            const role = ROLE_LABELS[ws.role] || { label: "Unknown", className: "bg-layer-2 text-tertiary" };
            return (
              <tr key={ws.id} className="border-t border-subtle">
                <td className="px-4 py-2.5 font-medium">{ws.workspace_name}</td>
                <td className="px-4 py-2.5 text-tertiary">{ws.workspace_slug}</td>
                <td className="px-4 py-2.5">
                  <span className={cn("text-11 px-1.5 py-0.5 rounded-sm font-medium", role.className)}>
                    {role.label}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-tertiary">{new Date(ws.created_at).toLocaleDateString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
