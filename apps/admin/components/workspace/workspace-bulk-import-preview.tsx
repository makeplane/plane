/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

export interface IWorkspaceRow {
  name: string;
  organization_size?: string;
}

type Props = { rows: IWorkspaceRow[] };

export const WorkspaceBulkImportPreview = observer(function WorkspaceBulkImportPreview({ rows }: Props) {
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
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Slug</th>
              <th className="px-3 py-2 text-left font-medium">Org Size</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-border-subtle">
                <td className="px-3 py-2 text-tertiary">{idx + 1}</td>
                <td className="px-3 py-2">{row.name || <span className="text-color-danger-primary">—</span>}</td>
                <td className="px-3 py-2 text-tertiary italic">auto-generated</td>
                <td className="px-3 py-2">{row.organization_size || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
