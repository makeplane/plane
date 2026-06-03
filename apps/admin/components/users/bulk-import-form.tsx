/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Upload } from "lucide-react";
// plane imports
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IInstanceUserBulkImportResponse } from "@plane/services";
// hooks
import { useInstanceUser } from "@/hooks/store";

export const BulkImportForm = observer(function BulkImportForm() {
  const { bulkImportUsers } = useInstanceUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IInstanceUserBulkImportResponse | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    try {
      const data = await bulkImportUsers(selectedFile);
      setResult(data);
      if (data.total_created > 0) {
        setToast({ type: TOAST_TYPE.SUCCESS, title: `${data.total_created} user(s) imported successfully` });
      }
      if (data.total_skipped > 0) {
        setToast({ type: TOAST_TYPE.WARNING, title: `${data.total_skipped} row(s) skipped` });
      }
    } catch (err) {
      const error = err as Record<string, string>;
      setToast({ type: TOAST_TYPE.ERROR, title: "Import failed", message: error?.error || "Something went wrong" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {/* Instructions */}
      <div className="border-border-subtle space-y-2 rounded-md border p-4">
        <p className="text-sm font-medium">CSV format requirements:</p>
        <p className="text-sm text-tertiary">
          File must have a header row with columns: <code className="text-primary">first_name</code>,{" "}
          <code className="text-primary">last_name</code>, <code className="text-primary">email</code>,{" "}
          <code className="text-primary">password</code>
        </p>
        <p className="text-sm text-tertiary">Password must be at least 8 characters. Max 500 rows per import.</p>
      </div>

      {/* File upload */}
      <div className="space-y-2">
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="border-border-subtle hover:bg-surface-hover flex w-full cursor-pointer items-center gap-3 rounded-md border border-dashed p-6 transition-colors"
        >
          <Upload className="h-5 w-5 text-tertiary" />
          <span className="text-sm">{selectedFile ? selectedFile.name : "Click to select a CSV file"}</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={!selectedFile || isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? "Importing..." : "Import users"}
        </Button>
        <Link href="/users" className={getButtonStyling("secondary", "lg")}>
          Cancel
        </Link>
      </div>

      {/* Results */}
      {result && <BulkImportResults result={result} />}
    </div>
  );
});

function BulkImportResults({ result }: { result: IInstanceUserBulkImportResponse }) {
  return (
    <div className="space-y-4">
      {/* Summary */}
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

      {/* Skipped rows detail */}
      {result.skipped.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Skipped rows:</p>
          <div className="border-border-subtle overflow-hidden rounded-md border">
            <table className="text-sm w-full">
              <thead className="bg-surface-subtle">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Row</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {result.skipped.map((item, idx) => (
                  <tr key={idx} className="border-border-subtle border-t">
                    <td className="px-3 py-2">{item.row_number}</td>
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
}
