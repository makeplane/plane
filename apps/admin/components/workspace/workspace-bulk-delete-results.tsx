/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { IWorkspaceBulkRemoveResponse } from "@plane/services";

type Props = { result: IWorkspaceBulkRemoveResponse };

export const WorkspaceBulkDeleteResults = observer(function WorkspaceBulkDeleteResults({ result }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="bg-success-secondary/20 text-sm rounded-md px-4 py-2">
          Removed: <strong>{result.total_removed}</strong>
        </div>
        {result.total_skipped > 0 && (
          <div className="bg-danger-secondary/20 text-sm rounded-md px-4 py-2">
            Skipped: <strong>{result.total_skipped}</strong>
          </div>
        )}
      </div>
      {result.skipped.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Skipped rows:</p>
          <div className="border-border-subtle overflow-hidden rounded-md border">
            <table className="text-sm w-full">
              <thead className="bg-surface-1">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Row</th>
                  <th className="px-3 py-2 text-left font-medium">Workspace</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {result.skipped.map((item, idx) => (
                  <tr key={idx} className="border-border-subtle border-t">
                    <td className="px-3 py-2">{item.row_number}</td>
                    <td className="px-3 py-2">{item.workspace_slug || "—"}</td>
                    <td className="px-3 py-2">{item.email || "—"}</td>
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
