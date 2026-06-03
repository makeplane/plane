/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { IWorkspaceProjectBulkImportResponse } from "@plane/services";

type Props = { result: IWorkspaceProjectBulkImportResponse };

export const WorkspaceProjectBulkImportResults = observer(function WorkspaceProjectBulkImportResults({
  result,
}: Props) {
  const createdWithWarnings = (result.created ?? []).filter((r) => r.skipped_members.length > 0);
  const updatedWithWarnings = (result.updated ?? []).filter((r) => r.skipped_members.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="text-sm rounded-md bg-success-primary/10 px-4 py-2">
          Created: <strong>{result.total_created}</strong>
        </div>
        {(result.total_updated ?? 0) > 0 && (
          <div className="bg-custom-primary/10 text-sm rounded-md px-4 py-2">
            Updated: <strong>{result.total_updated}</strong>
          </div>
        )}
        {result.total_skipped > 0 && (
          <div className="text-sm rounded-md bg-danger-primary/10 px-4 py-2">
            Skipped: <strong>{result.total_skipped}</strong>
          </div>
        )}
        {(createdWithWarnings.length > 0 || updatedWithWarnings.length > 0) && (
          <div className="text-sm rounded-md bg-warning-primary/10 px-4 py-2">
            Member warnings: <strong>{createdWithWarnings.length + updatedWithWarnings.length}</strong> project(s)
          </div>
        )}
      </div>

      {/* Projects created but with some members skipped */}
      {createdWithWarnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Member import warnings:</p>
          <div className="border-border-subtle overflow-hidden rounded-md border">
            <table className="text-sm w-full">
              <thead className="bg-surface-subtle">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Project</th>
                  <th className="px-3 py-2 text-left font-medium">Skipped Members</th>
                </tr>
              </thead>
              <tbody>
                {createdWithWarnings.map((item, idx) => (
                  <tr key={idx} className="border-border-subtle border-t">
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2 text-warning-primary">{item.skipped_members.join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Updated projects with some members skipped */}
      {updatedWithWarnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Member import warnings (updated projects):</p>
          <div className="border-border-subtle overflow-hidden rounded-md border">
            <table className="text-sm w-full">
              <thead className="bg-surface-subtle">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Project</th>
                  <th className="px-3 py-2 text-left font-medium">Skipped Members</th>
                </tr>
              </thead>
              <tbody>
                {updatedWithWarnings.map((item, idx) => (
                  <tr key={idx} className="border-border-subtle border-t">
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2 text-warning-primary">{item.skipped_members.join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fully skipped rows */}
      {result.skipped.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Skipped rows:</p>
          <div className="border-border-subtle overflow-hidden rounded-md border">
            <table className="text-sm w-full">
              <thead className="bg-surface-subtle">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Row</th>
                  <th className="px-3 py-2 text-left font-medium">Workspace</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {result.skipped.map((item, idx) => (
                  <tr key={idx} className="border-border-subtle border-t">
                    <td className="px-3 py-2">{item.row_number}</td>
                    <td className="px-3 py-2">{item.workspace_slug || "—"}</td>
                    <td className="px-3 py-2">{item.name || "—"}</td>
                    <td className="px-3 py-2 text-danger-primary">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});
