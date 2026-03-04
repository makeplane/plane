/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { IWorkspaceBulkCreateResponse } from "@plane/services";

type Props = { result: IWorkspaceBulkCreateResponse };

export const WorkspaceBulkImportResults = observer(function WorkspaceBulkImportResults({ result }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="rounded-md bg-color-success-primary/10 px-4 py-2 text-sm">
          Created: <strong>{result.total_created}</strong>
        </div>
        {result.total_skipped > 0 && (
          <div className="rounded-md bg-color-danger-primary/10 px-4 py-2 text-sm">
            Skipped: <strong>{result.total_skipped}</strong>
          </div>
        )}
      </div>
      {result.skipped.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Skipped rows:</p>
          <div className="rounded-md border border-border-subtle overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Row</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {result.skipped.map((item, idx) => (
                  <tr key={idx} className="border-t border-border-subtle">
                    <td className="px-3 py-2">{item.row_number}</td>
                    <td className="px-3 py-2">{item.name || "—"}</td>
                    <td className="px-3 py-2 text-color-danger-primary">{item.reason}</td>
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
