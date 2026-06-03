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
        <div className="text-sm rounded-md bg-success-primary/10 px-4 py-2">
          Created: <strong>{result.total_created}</strong>
        </div>
        {result.total_skipped > 0 && (
          <div className="text-sm rounded-md bg-danger-primary/10 px-4 py-2">
            Skipped: <strong>{result.total_skipped}</strong>
          </div>
        )}
      </div>
      {result.skipped.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Skipped rows:</p>
          <div className="border-border-subtle overflow-hidden rounded-md border">
            <table className="text-sm w-full">
              <thead className="bg-surface-subtle">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Row</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {result.skipped.map((item, idx) => (
                  <tr key={idx} className="border-border-subtle border-t">
                    <td className="px-3 py-2">{item.row_number}</td>
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
