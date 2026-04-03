/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IDepartmentBulkImportResponse, IDepartmentBulkImportRow } from "@plane/services";
import { useInstanceDepartment } from "@/hooks/store";

const MAX_ROWS = 500;
const MAX_FILE_SIZE_MB = 5;
const TEMPLATE_HEADERS = [
  "name",
  "short_name",
  "dept_code",
  "dept_type",
  "code",
  "parent_code",
  "manager_email",
  "sort_order",
  "is_active",
];

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Departments");
  XLSX.writeFile(wb, "department-import-template.xlsx");
}

async function parseExcel(file: File): Promise<IDepartmentBulkImportRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<IDepartmentBulkImportRow>(sheet);
}

export const DepartmentImportForm = observer(function DepartmentImportForm() {
  const { bulkImport } = useInstanceDepartment();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<IDepartmentBulkImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IDepartmentBulkImportResponse | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    setParseError(null);
    setParsedRows([]);
    if (!file) return;

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setParseError("Only .xlsx and .xls files are accepted.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setParseError(`File too large. Maximum ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    try {
      const rows = await parseExcel(file);
      if (rows.length > MAX_ROWS) {
        setParseError(`Too many rows: ${rows.length}. Maximum allowed is ${MAX_ROWS}.`);
        return;
      }
      setParsedRows(rows);
    } catch {
      setParseError("Failed to parse the file. Ensure it is a valid .xlsx or .xls file.");
    }
  }, []);

  const handleSubmit = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    try {
      const data = await bulkImport({ departments: parsedRows });
      setResult(data);
      if (data.total_created > 0) {
        setToast({ type: TOAST_TYPE.SUCCESS, title: `${data.total_created} department(s) imported successfully` });
        router.push("/departments");
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
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Instructions */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Excel file requirements:</p>
        <p className="text-sm text-tertiary">
          Required columns: <code className="text-primary">name</code>, <code className="text-primary">short_name</code>
          , <code className="text-primary">dept_code</code>, <code className="text-primary">dept_type</code>{" "}
          (HO/BRX/OSR). Optional: <code className="text-primary">code</code>,{" "}
          <code className="text-primary">parent_code</code>, <code className="text-primary">manager_email</code>.
        </p>
        <p className="text-sm text-tertiary">
          Max {MAX_ROWS} rows and {MAX_FILE_SIZE_MB} MB per import.
        </p>
      </div>

      {/* Template download */}
      <button
        type="button"
        onClick={() => void downloadTemplate()}
        className="flex items-center gap-2 text-sm text-primary hover:underline w-fit"
      >
        <Download className="h-4 w-4" />
        Download template
      </button>

      {/* File upload */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => void handleFileChange(e)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 rounded-md border border-dashed border-border-subtle p-6 w-full hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <Upload className="h-5 w-5 text-tertiary" />
          <span className="text-sm">
            {selectedFile ? selectedFile.name : "Click to select an Excel file (.xlsx, .xls)"}
          </span>
        </button>
        {parseError && <p className="text-sm text-danger-primary">{parseError}</p>}
      </div>

      {/* Preview table */}
      {parsedRows.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-subtle">
          <table className="min-w-full text-sm">
            <thead className="bg-layer-1">
              <tr>
                {["name", "short_name", "dept_code", "dept_type", "parent_code"].map((col) => (
                  <th key={col} className="px-3 py-2 text-left font-medium text-tertiary">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {parsedRows.slice(0, 10).map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">{String(row.name ?? "")}</td>
                  <td className="px-3 py-2">{String(row.short_name ?? "")}</td>
                  <td className="px-3 py-2">{String(row.dept_code ?? "")}</td>
                  <td className="px-3 py-2">{String(row.dept_type ?? "")}</td>
                  <td className="px-3 py-2">{String(row.parent_code ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {parsedRows.length > 10 && (
            <p className="px-3 py-2 text-xs text-tertiary border-t border-subtle">
              Showing 10 of {parsedRows.length} rows
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={parsedRows.length === 0 || isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? "Importing..." : `Import ${parsedRows.length > 0 ? parsedRows.length : ""} departments`}
        </Button>
        <Link href="/departments" className={getButtonStyling("secondary", "lg")}>
          Cancel
        </Link>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3 rounded-md border border-subtle p-4">
          <p className="text-sm font-medium">
            Import complete: <span className="text-success-primary">{result.total_created} created</span>
            {result.total_skipped > 0 && <span className="text-warning-primary">, {result.total_skipped} skipped</span>}
          </p>
          {result.skipped.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-tertiary">Skipped rows:</p>
              {result.skipped.map((s, i) => (
                <p key={i} className="text-xs text-danger-primary">
                  Row {s.row_number} ({s.name}): {s.reason}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
