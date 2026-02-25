/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises, @typescript-eslint/no-unused-vars */
"use client";

import { useState, useRef } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Upload } from "lucide-react";
import { StaffService } from "@/plane-web/services/staff.service";

interface StaffImportModalProps {
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const staffService = new StaffService();

export const StaffImportModal = observer(function StaffImportModal({
  workspaceSlug,
  isOpen,
  onClose,
  onSuccess,
}: StaffImportModalProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Invalid file",
          message: "Please select a CSV file.",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const result = await staffService.bulkImport(workspaceSlug, formData);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Import successful",
        message: `Successfully imported ${result.success} staff members.`,
      });
      if (result.errors && result.errors.length > 0) {
        console.error("Import errors:", result.errors);
        setToast({
          type: TOAST_TYPE.WARNING,
          title: "Some errors occurred",
          message: `${result.errors.length} rows had errors. Check console for details.`,
        });
      }
      onSuccess();
      onClose();
      setSelectedFile(null);
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Import failed",
        message: error?.message || "Failed to import staff data.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-custom-backdrop">
      <div className="w-full max-w-md rounded-lg bg-custom-background-100 p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Import Staff from CSV</h2>

        <div className="space-y-4">
          <div className="rounded-md border border-custom-border-200 bg-custom-background-80 p-4">
            <p className="mb-2 text-sm font-medium">CSV Format Requirements:</p>
            <ul className="list-inside list-disc space-y-1 text-xs text-custom-text-300">
              <li>staff_id (required)</li>
              <li>department (optional - department code)</li>
              <li>position (optional)</li>
              <li>status (optional - active/probation/resigned/terminated)</li>
              <li>joined_date (optional - YYYY-MM-DD)</li>
              <li>resigned_date (optional - YYYY-MM-DD)</li>
            </ul>
          </div>

          <div>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {selectedFile ? selectedFile.name : "Select CSV File"}
            </Button>
          </div>

          {selectedFile && (
            <div className="rounded-md bg-custom-background-80 p-3 text-sm">
              <p className="text-custom-text-200">
                <span className="font-medium">Selected file: </span>
                {selectedFile.name}
              </p>
              <p className="text-custom-text-300">
                <span className="font-medium">Size: </span>
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpload} loading={isUploading} disabled={!selectedFile}>
              Import
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
