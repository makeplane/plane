/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Download, Upload } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IJobPositionBulkImportResponse, IJobPositionImportRow } from "@plane/types";
import { useInstanceJobPosition } from "@/hooks/store";

const MAX_ROWS = 500;
const MAX_FILE_SIZE_MB = 5;
const TEMPLATE_HEADERS = ["type", "grade_name", "name", "description", "sort_order", "is_active"];

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const rows = [
    TEMPLATE_HEADERS,
    ["grade", "", "Senior", "Senior level", 1, "TRUE"],
    ["position", "Senior", "Senior Engineer", "Software engineer at senior level", 1, "TRUE"],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Job Positions");
  XLSX.writeFile(wb, "job-positions-template.xlsx");
}

async function parseExcel(file: File): Promise<IJobPositionImportRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<IJobPositionImportRow>(sheet);
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const JobPositionImportModal = observer(function JobPositionImportModal({ isOpen, onClose }: Props) {
  const { bulkImport } = useInstanceJobPosition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<IJobPositionImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IJobPositionBulkImportResponse | null>(null);

  const handleClose = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setParseError(null);
    setResult(null);
    onClose();
  };

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
      const grades = parsedRows
        .filter((r) => String(r.type).toLowerCase() === "grade")
        .map((r) => ({
          name: String(r.name ?? "").trim(),
          description: r.description ? String(r.description).trim() : undefined,
          sort_order: r.sort_order !== undefined ? Number(r.sort_order) : undefined,
          is_active: r.is_active !== undefined ? r.is_active : undefined,
        }));
      const positions = parsedRows
        .filter((r) => String(r.type).toLowerCase() === "position")
        .map((r) => ({
          grade_name: String(r.grade_name ?? "").trim(),
          name: String(r.name ?? "").trim(),
          description: r.description ? String(r.description).trim() : undefined,
          sort_order: r.sort_order !== undefined ? Number(r.sort_order) : undefined,
          is_active: r.is_active !== undefined ? r.is_active : undefined,
        }));

      const data = await bulkImport({ grades, positions });
      setResult(data);
      const totalCreated = data.total_grade_created + data.total_position_created;
      const totalSkipped = data.total_grade_skipped + data.total_position_skipped;
      if (totalCreated > 0) {
        setToast({ type: TOAST_TYPE.SUCCESS, title: `${totalCreated} item(s) imported successfully` });
      }
      if (totalSkipped > 0) {
        setToast({ type: TOAST_TYPE.WARNING, title: `${totalSkipped} row(s) skipped` });
      }
    } catch (err) {
      const error = err as Record<string, string>;
      setToast({ type: TOAST_TYPE.ERROR, title: "Import failed", message: error?.error || "Something went wrong" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-1 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h2 className="text-16 font-semibold">Import Job Positions</h2>
          <button type="button" onClick={handleClose} className="text-tertiary hover:text-primary text-xl leading-none">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Instructions */}
          <div className="space-y-1">
            <p className="text-sm text-tertiary">
              Single-sheet Excel with columns: <code className="text-primary">type</code> (grade/position),{" "}
              <code className="text-primary">grade_name</code>, <code className="text-primary">name</code>,{" "}
              <code className="text-primary">description</code>, <code className="text-primary">sort_order</code>,{" "}
              <code className="text-primary">is_active</code>.
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
                    {["type", "grade_name", "name", "description", "sort_order", "is_active"].map((col) => (
                      <th key={col} className="px-3 py-2 text-left font-medium text-tertiary whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {parsedRows.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{String(row.type ?? "")}</td>
                      <td className="px-3 py-2">{String(row.grade_name ?? "")}</td>
                      <td className="px-3 py-2">{String(row.name ?? "")}</td>
                      <td className="px-3 py-2">{String(row.description ?? "")}</td>
                      <td className="px-3 py-2">{String(row.sort_order ?? "")}</td>
                      <td className="px-3 py-2">{String(row.is_active ?? "")}</td>
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

          {/* Results */}
          {result && (
            <div className="space-y-3 rounded-md border border-subtle p-4">
              <p className="text-sm font-medium">Import complete:</p>
              <p className="text-sm">
                Grades: <span className="text-success-primary">{result.total_grade_created} created</span>
                {result.total_grade_skipped > 0 && (
                  <span className="text-warning-primary">, {result.total_grade_skipped} skipped</span>
                )}
              </p>
              <p className="text-sm">
                Positions: <span className="text-success-primary">{result.total_position_created} created</span>
                {result.total_position_skipped > 0 && (
                  <span className="text-warning-primary">, {result.total_position_skipped} skipped</span>
                )}
              </p>
              {[...result.grade_skipped, ...result.position_skipped].length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-tertiary">Skipped rows:</p>
                  {[...result.grade_skipped, ...result.position_skipped].map((s, i) => (
                    <p key={i} className="text-xs text-danger-primary">
                      Row {s.row_number} ({s.name}): {s.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-subtle">
          <Button variant="secondary" size="sm" onClick={handleClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              disabled={parsedRows.length === 0 || isSubmitting}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? "Importing..." : `Import ${parsedRows.length > 0 ? parsedRows.length : ""} rows`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
