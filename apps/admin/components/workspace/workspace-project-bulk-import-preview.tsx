/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

export interface IProjectRow {
  workspace_slug: string;
  name: string;
  description?: string;
  network?: number;
  project_leader?: string;
  members?: string;
  member_roles?: string;
}

type Props = { rows: IProjectRow[] };

export const WorkspaceProjectBulkImportPreview = observer(function WorkspaceProjectBulkImportPreview({ rows }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Preview — <span className="text-tertiary">{rows.length} row(s)</span>
      </p>
      <div className="shadow-sm max-h-64 overflow-auto rounded-md">
        <table className="text-sm w-full">
          <thead className="sticky top-0 z-10 bg-surface-1">
            <tr>
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Workspace Slug</th>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Description</th>
              <th className="px-3 py-2 text-left font-medium">Network</th>
              <th className="px-3 py-2 text-left font-medium">Project Leader</th>
              <th className="px-3 py-2 text-left font-medium">Members</th>
              <th className="px-3 py-2 text-left font-medium">Roles</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-border-subtle border-t">
                <td className="px-3 py-2 text-tertiary">{idx + 1}</td>
                <td className="px-3 py-2">{row.workspace_slug || <span className="text-danger-primary">—</span>}</td>
                <td className="px-3 py-2">{row.name || <span className="text-danger-primary">—</span>}</td>
                <td className="px-3 py-2 text-tertiary">{row.description || "—"}</td>
                <td className="px-3 py-2">{row.network === 0 ? "Private" : "Public"}</td>
                <td className="px-3 py-2 text-tertiary">{row.project_leader || "—"}</td>
                <td className="px-3 py-2 text-tertiary">{row.members || "—"}</td>
                <td className="px-3 py-2 text-tertiary">{row.member_roles || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
