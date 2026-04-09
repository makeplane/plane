/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { Download, Upload, X } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IDepartmentBulkLinkCategoriesResponse, IDepartmentBulkLinkCategoriesRow } from "@plane/services";
import { useInstanceDepartment } from "@/hooks/store";

const MAX_ROWS = 500;
const MAX_FILE_MB = 5;

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([
    ["dept_code", "category_name"],
    ["DEPT001", "Engineering"],
    ["DEPT001", "Finance"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "BulkLinkCategories");
  XLSX.writeFile(wb, "bulk-link-categories-template.xlsx");
}

async function parseFile(file: File): Promise<IDepartmentBulkLinkCategoriesRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<IDepartmentBulkLinkCategoriesRow>(sheet);
}

type Props = { open: boolean; onClose: () => void };

export function BulkLinkCategoriesModal({ open, onClose }: Props) {
  const { bulkLinkCategories } = useInstanceDepartment();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<IDepartmentBulkLinkCategoriesRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IDepartmentBulkLinkCategoriesResponse | null>(null);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    setRows([]);
    setResult(null);
    setFileName("");
    if (!file) return;
    if (!/\.(xlsx|xls|aaa)$/i.test(file.name)) {
      setFileError("Only .xlsx/.xls/.aaa files accepted.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`Max ${MAX_FILE_MB} MB.`);
      return;
    }
    try {
      const parsed = await parseFile(file);
      if (parsed.length > MAX_ROWS) {
        setFileError(`Max ${MAX_ROWS} rows (got ${parsed.length}).`);
        return;
      }
      setRows(parsed);
      setFileName(file.name);
    } catch {
      setFileError("Failed to parse file. Ensure it is a valid .xlsx or .xls file.");
    }
  }, []);

  const handleSubmit = async () => {
    if (rows.length === 0) return;
    setIsSubmitting(true);
    try {
      const data = await bulkLinkCategories({ links: rows });
      setResult(data);
      if (data.total_linked > 0) {
        setToast({ type: TOAST_TYPE.SUCCESS, title: `${data.total_linked} category link(s) created` });
      }
      if (data.total_skipped > 0) {
        setToast({ type: TOAST_TYPE.WARNING, title: `${data.total_skipped} row(s) skipped` });
      }
    } catch (err) {
      const e = err as Record<string, string>;
      setToast({ type: TOAST_TYPE.ERROR, title: "Bulk link failed", message: e?.error ?? "Something went wrong" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-layer-1 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Bulk Link Categories to Departments</h2>
          <button onClick={onClose} className="text-tertiary hover:text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-tertiary">
          Upload an Excel file with columns <code className="text-primary">dept_code</code> and{" "}
          <code className="text-primary">category_name</code>. Max {MAX_ROWS} rows, {MAX_FILE_MB} MB.
        </p>

        <button
          type="button"
          onClick={() => void downloadTemplate()}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Download className="w-4 h-4" /> Download template
        </button>

        <div className="space-y-1">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.aaa"
            onChange={(e) => void handleFile(e)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 rounded-md border border-dashed border-border-subtle p-4 w-full hover:bg-surface-hover transition-colors"
          >
            <Upload className="w-4 h-4 text-tertiary" />
            <span className="text-sm">{fileName || "Click to select .xlsx/.xls file"}</span>
          </button>
          {fileError && <p className="text-sm text-danger-primary">{fileError}</p>}
        </div>

        {rows.length > 0 && (
          <div className="overflow-x-auto rounded border border-subtle max-h-40">
            <table className="min-w-full text-sm">
              <thead className="bg-layer-2">
                <tr>
                  <th className="px-3 py-1.5 text-left text-xs font-medium text-tertiary">dept_code</th>
                  <th className="px-3 py-1.5 text-left text-xs font-medium text-tertiary">category_name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5">{String(r.dept_code ?? "")}</td>
                    <td className="px-3 py-1.5">{String(r.category_name ?? "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 10 && (
              <p className="px-3 py-1 text-xs text-tertiary border-t border-subtle">Showing 10 of {rows.length} rows</p>
            )}
          </div>
        )}

        {result && (
          <div className="rounded border border-subtle p-3 space-y-2 text-sm">
            <p>
              <span className="text-success-primary font-medium">{result.total_linked} linked</span>
              {result.total_skipped > 0 && (
                <span className="text-warning-primary">, {result.total_skipped} skipped</span>
              )}
            </p>
            {result.skipped.length > 0 && (
              <ul className="space-y-0.5 max-h-28 overflow-y-auto">
                {result.skipped.map((s, i) => (
                  <li key={i} className="text-xs text-danger-primary">
                    Row {s.row}
                    {s.dept_code ? ` (${s.dept_code})` : ""}: {s.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={isSubmitting}
            disabled={rows.length === 0 || isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? "Linking..." : `Link ${rows.length > 0 ? rows.length : ""} rows`}
          </Button>
        </div>
      </div>
    </div>
  );
}
