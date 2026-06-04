/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Download, Upload } from "lucide-react";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceBulkRemoveResponse } from "@plane/services";
import { useWorkspace } from "@/hooks/store";
import { WorkspaceBulkDeletePreview } from "./workspace-bulk-delete-preview";
import { WorkspaceBulkDeleteResults } from "./workspace-bulk-delete-results";
import type { IWorkspaceDeleteRow } from "./workspace-bulk-delete-preview";

const MAX_ROWS = 500;
const MAX_FILE_SIZE_MB = 5;

async function downloadDeleteTemplate() {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([["workspace_slug", "email"]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Deletions");
  XLSX.writeFile(wb, "workspace-delete-members-template.xlsx");
}

async function parseExcelForDelete(file: File): Promise<IWorkspaceDeleteRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return raw.map((r) => {
    const slug = r.workspace_slug;
    const emailVal = r.email;
    return {
      workspace_slug: (typeof slug === "string" || typeof slug === "number" ? String(slug) : "").trim(),
      email: (typeof emailVal === "string" || typeof emailVal === "number" ? String(emailVal) : "")
        .trim()
        .toLowerCase(),
    };
  });
}

export const WorkspaceBulkDeleteForm = observer(function WorkspaceBulkDeleteForm() {
  const { bulkRemoveMembers } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<IWorkspaceDeleteRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IWorkspaceBulkRemoveResponse | null>(null);

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
      const rows = await parseExcelForDelete(file);
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
      const data = await bulkRemoveMembers(
        parsedRows.map((r) => ({ workspace_slug: r.workspace_slug, email: r.email }))
      );
      setResult(data);
      if (data.total_removed > 0) {
        setToast({ type: TOAST_TYPE.SUCCESS, title: `${data.total_removed} member(s) removed successfully` });
      }
      if (data.total_skipped > 0) {
        setToast({ type: TOAST_TYPE.WARNING, title: `${data.total_skipped} row(s) skipped` });
      }
    } catch (err) {
      const error = err as Record<string, string>;
      setToast({ type: TOAST_TYPE.ERROR, title: "Removal failed", message: error?.error || "Something went wrong" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="rounded-md border border-border-subtle bg-surface-1 p-4 space-y-3">
        <p className="text-sm font-semibold">Excel file requirements</p>
        <div className="text-sm text-tertiary space-y-1">
          <p>Required columns (header row):</p>
          <ul className="ml-4 space-y-1 list-disc">
            <li>
              <code className="text-primary font-mono">workspace_slug</code> — target workspace slug
            </li>
            <li>
              <code className="text-primary font-mono">email</code> — existing user&apos;s email address
            </li>
          </ul>
        </div>
        <p className="text-xs text-tertiary">
          Max {MAX_ROWS} rows · Max {MAX_FILE_SIZE_MB} MB · .xlsx, .xls, or .aaa only
        </p>
      </div>

      <button
        type="button"
        onClick={() => void downloadDeleteTemplate()}
        className="flex items-center gap-2 text-sm text-primary hover:underline w-fit"
      >
        <Download className="h-4 w-4" />
        Download template
      </button>

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

      {parsedRows.length > 0 && <WorkspaceBulkDeletePreview rows={parsedRows} />}

      <div className="flex items-center gap-4">
        <Button
          variant="error-fill"
          size="lg"
          loading={isSubmitting}
          disabled={parsedRows.length === 0 || isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? "Removing..." : "Remove members"}
        </Button>
        <Link href="/workspace" className={getButtonStyling("secondary", "lg")}>
          Cancel
        </Link>
      </div>

      {result && <WorkspaceBulkDeleteResults result={result} />}
    </div>
  );
});
