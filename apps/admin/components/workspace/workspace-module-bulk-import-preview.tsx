/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

export interface IModuleRow {
  workspace_slug: string;
  project_name: string;
  name: string;
  description?: string;
  status?: string;
  start_date?: string;
  target_date?: string;
}

type Props = { rows: IModuleRow[] };

export const WorkspaceModuleBulkImportPreview = observer(function WorkspaceModuleBulkImportPreview({ rows }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Preview — <span className="text-tertiary">{rows.length} row(s)</span>
      </p>
      <div className="rounded-md shadow-sm overflow-auto max-h-64">
        <table className="w-full text-sm">
          <thead className="bg-surface-1 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Workspace Slug</th>
              <th className="px-3 py-2 text-left font-medium">Project Name</th>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Description</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Start Date</th>
              <th className="px-3 py-2 text-left font-medium">Target Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-border-subtle">
                <td className="px-3 py-2 text-tertiary">{idx + 1}</td>
                <td className="px-3 py-2">{row.workspace_slug || <span className="text-danger-primary">—</span>}</td>
                <td className="px-3 py-2">{row.project_name || <span className="text-danger-primary">—</span>}</td>
                <td className="px-3 py-2">{row.name || <span className="text-danger-primary">—</span>}</td>
                <td className="px-3 py-2 text-tertiary">{row.description || "—"}</td>
                <td className="px-3 py-2 text-tertiary">{row.status || "planned"}</td>
                <td className="px-3 py-2 text-tertiary">{row.start_date || "—"}</td>
                <td className="px-3 py-2 text-tertiary">{row.target_date || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
