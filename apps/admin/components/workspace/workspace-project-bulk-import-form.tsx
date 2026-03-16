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
import type { IWorkspaceProjectBulkImportResponse } from "@plane/services";
// hooks
import { useWorkspace } from "@/hooks/store";
// components
import { WorkspaceProjectBulkImportPreview } from "./workspace-project-bulk-import-preview";
import { WorkspaceProjectBulkImportResults } from "./workspace-project-bulk-import-results";
import type { IProjectRow } from "./workspace-project-bulk-import-preview";

const MAX_ROWS = 100;
const MAX_FILE_SIZE_MB = 5;

/** Download a 7-column project import template (.xlsx) */
async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const templateSheet = XLSX.utils.aoa_to_sheet([
    ["workspace_slug", "name", "description", "network", "project_leader", "members", "member_roles"],
    [
      "my-workspace",
      "Project Alpha",
      "Example project description",
      2,
      "lead@example.com",
      "member1@example.com,member2@example.com",
      "15,20",
    ],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, templateSheet, "Projects");
  XLSX.writeFile(workbook, "project-import-template.xlsx");
}

/** Parse an .xlsx / .xls file → array of project row objects */
async function parseExcel(file: File): Promise<IProjectRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<IProjectRow>(sheet);
}

export const WorkspaceProjectBulkImportForm = observer(function WorkspaceProjectBulkImportForm() {
  const { bulkImportProjects } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<IProjectRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IWorkspaceProjectBulkImportResponse | null>(null);

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
      const data = await bulkImportProjects(
        parsedRows.map((r) => ({
          workspace_slug: r.workspace_slug,
          name: r.name,
          description: r.description,
          network: r.network,
          project_leader: r.project_leader,
          members: r.members,
          member_roles: r.member_roles,
        }))
      );
      setResult(data);
      if (data.total_created > 0) {
        setToast({ type: TOAST_TYPE.SUCCESS, title: `${data.total_created} project(s) imported successfully` });
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
          Required: <code className="text-primary">workspace_slug</code>, <code className="text-primary">name</code>.
          Optional: <code className="text-primary">description</code>, <code className="text-primary">network</code>{" "}
          (0=Private / 2=Public, default: 2), <code className="text-primary">project_leader</code> (email),{" "}
          <code className="text-primary">members</code> (comma-separated emails),{" "}
          <code className="text-primary">member_roles</code> (comma-separated: 5=Guest / 15=Member / 20=Admin, default:
          15).
        </p>
        <p className="text-sm text-tertiary">
          Max {MAX_ROWS} rows and {MAX_FILE_SIZE_MB} MB per import. Each row can target a different workspace.
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

      {parsedRows.length > 0 && <WorkspaceProjectBulkImportPreview rows={parsedRows} />}

      <div className="flex items-center gap-4">
        <Button
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={parsedRows.length === 0 || isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? "Importing..." : "Import projects"}
        </Button>
        <Link href="/workspace" className={getButtonStyling("secondary", "lg")}>
          Cancel
        </Link>
      </div>

      {result && <WorkspaceProjectBulkImportResults result={result} />}
    </div>
  );
});
