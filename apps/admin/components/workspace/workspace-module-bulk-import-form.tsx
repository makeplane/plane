/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Download, Upload } from "lucide-react";
// plane imports
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceModuleBulkImportResponse } from "@plane/services";
// hooks
import { useWorkspace } from "@/hooks/store";
// components
import { WorkspaceModuleBulkImportPreview } from "./workspace-module-bulk-import-preview";
import { WorkspaceModuleBulkImportResults } from "./workspace-module-bulk-import-results";
import type { IModuleRow } from "./workspace-module-bulk-import-preview";

const MAX_ROWS = 100;
const MAX_FILE_SIZE_MB = 5;

/** Download a 7-column module import template (.xlsx) */
async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const templateSheet = XLSX.utils.aoa_to_sheet([
    ["workspace_slug", "project_name", "name", "description", "status", "start_date", "target_date"],
    ["my-workspace", "My Project", "Sprint 1", "First sprint", "planned", "2026-01-01", "2026-01-14"],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, templateSheet, "Modules");
  XLSX.writeFile(workbook, "module-import-template.xlsx");
}

/** Parse an .xlsx / .xls file → array of module row objects */
async function parseExcel(file: File): Promise<IModuleRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<IModuleRow>(sheet);
}

export const WorkspaceModuleBulkImportForm = observer(function WorkspaceModuleBulkImportForm() {
  const { bulkImportModules } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<IModuleRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IWorkspaceModuleBulkImportResponse | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    setParseError(null);
    setParsedRows([]);

    if (!file) return;

    if (!/\.(xlsx|xls|aaa)$/i.test(file.name)) {
      setParseError("Only .xlsx, .xls, and .aaa files are accepted.");
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
      const data = await bulkImportModules(
        parsedRows.map((r) => ({
          workspace_slug: r.workspace_slug,
          project_name: r.project_name,
          name: r.name,
          description: r.description,
          status: r.status,
          start_date: r.start_date,
          target_date: r.target_date,
        }))
      );
      setResult(data);
      if (data.total_created > 0) {
        setToast({ type: TOAST_TYPE.SUCCESS, title: `${data.total_created} module(s) imported successfully` });
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
          Required: <code className="text-primary">workspace_slug</code>,{" "}
          <code className="text-primary">project_name</code> (exact project name),{" "}
          <code className="text-primary">name</code>. Optional: <code className="text-primary">description</code>,{" "}
          <code className="text-primary">status</code> (backlog / planned / in-progress / paused / completed /
          cancelled, default: planned), <code className="text-primary">start_date</code> /{" "}
          <code className="text-primary">target_date</code> (YYYY-MM-DD).
        </p>
        <p className="text-sm text-tertiary">
          Max {MAX_ROWS} rows and {MAX_FILE_SIZE_MB} MB per import. Each row can target a different project or
          workspace.
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
          accept=".xlsx,.xls,.aaa"
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
            {selectedFile ? selectedFile.name : "Click to select an Excel file (.xlsx, .xls, .aaa)"}
          </span>
        </button>
        {parseError && <p className="text-sm text-danger-primary">{parseError}</p>}
      </div>

      {parsedRows.length > 0 && <WorkspaceModuleBulkImportPreview rows={parsedRows} />}

      <div className="flex items-center gap-4">
        <Button
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={parsedRows.length === 0 || isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? "Importing..." : "Import modules"}
        </Button>
        <Link href="/workspace" className={getButtonStyling("secondary", "lg")}>
          Cancel
        </Link>
      </div>

      {result && <WorkspaceModuleBulkImportResults result={result} />}
    </div>
  );
});
