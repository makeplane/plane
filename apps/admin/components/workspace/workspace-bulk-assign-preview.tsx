/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

export interface IWorkspaceAssignRow {
  email: string;
  workspace_slug: string;
  role?: number | string;
}

type Props = { rows: IWorkspaceAssignRow[] };

export const WorkspaceBulkAssignPreview = observer(function WorkspaceBulkAssignPreview({ rows }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Preview — <span className="text-tertiary">{rows.length} row(s)</span>
      </p>
      <div className="rounded-md border border-border-subtle overflow-auto max-h-64">
        <table className="w-full text-sm">
          <thead className="bg-surface-1 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Workspace Slug</th>
              <th className="px-3 py-2 text-left font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-border-subtle">
                <td className="px-3 py-2 text-tertiary">{idx + 1}</td>
                <td className="px-3 py-2">{row.email || <span className="text-danger-primary">—</span>}</td>
                <td className="px-3 py-2">{row.workspace_slug || <span className="text-danger-primary">—</span>}</td>
                <td className="px-3 py-2">{String(row.role ?? 15)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
