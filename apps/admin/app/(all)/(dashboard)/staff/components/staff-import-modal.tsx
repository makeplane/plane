/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { Download, Upload } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IInstanceStaffBulkImportResponse } from "@plane/services";
import { useInstanceStaff } from "@/hooks/store";

type Props = {
  open: boolean;
  onClose: () => void;
};

export const StaffImportModal = observer(function StaffImportModal({ open, onClose }: Props) {
  const { bulkImport, fetchStaff } = useInstanceStaff();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [defaultPassword, setDefaultPassword] = useState("");
  const [skipExisting, setSkipExisting] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IInstanceStaffBulkImportResponse | null>(null);

  const handleDownloadTemplate = () => {
    const headers = "staff_id,first_name,last_name,display_name,department_code,position,job_grade,phone,date_of_joining";
    const sample = "EMP001,John,Doe,Johnny,DEPT01,Engineer,G5,0901234567,2025-01-15";
    const blob = new Blob([`${headers}\n${sample}\n`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staff-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setDefaultPassword("");
    setSkipExisting(true);
    setUpdateExisting(false);
    setResult(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!file || !defaultPassword) return;
    setIsSubmitting(true);
    try {
      const data = await bulkImport(file, defaultPassword, skipExisting, updateExisting);
      setResult(data);
      if (data.created > 0 || data.updated > 0) {
        setToast({ type: TOAST_TYPE.SUCCESS, title: `${data.created} created, ${data.updated} updated` });
        fetchStaff().catch(() => {});
      }
      if (data.skipped > 0) {
        setToast({ type: TOAST_TYPE.WARNING, title: `${data.skipped} rows skipped` });
      }
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Import failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6 space-y-4">
          <Dialog.Title>Bulk Import Staff</Dialog.Title>

          <div className="rounded-md border border-subtle p-3 text-13 text-tertiary space-y-1">
            <p>
              CSV columns:{" "}
              <code className="text-primary">
                staff_id, first_name, last_name, display_name, department_code, position, job_grade, phone,
                date_of_joining
              </code>
            </p>
            <p>Max 500 rows. Default password used for new user accounts.</p>
          </div>

          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-13 font-medium">CSV file</span>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1 text-xs text-custom-primary-100 hover:underline w-fit"
            >
              <Download className="h-3.5 w-3.5" />
              Download template
            </button>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 rounded-md border border-dashed border-subtle p-5 w-full hover:bg-layer-2 transition-colors"
          >
            <Upload className="h-5 w-5 text-tertiary" />
            <span className="text-13">{file ? file.name : "Click to select a CSV file"}</span>
          </button>

          {/* Default password */}
          <div className="space-y-1">
            <label htmlFor="default_password" className="text-13 font-medium">
              Default password{" "}
            </label>
            <Input
              id="default_password"
              type="password"
              value={defaultPassword}
              onChange={(e) => setDefaultPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
          </div>

          {/* Skip / update existing */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="skip_existing"
                checked={skipExisting}
                onChange={(e) => setSkipExisting(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="skip_existing" className="text-13">
                Skip existing staff
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="update_existing"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="update_existing" className="text-13">
                Update existing staff fields
              </label>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-2">
              <div className="flex gap-3 text-13 flex-wrap">
                <span className="px-3 py-1.5 rounded bg-success-subtle text-success-primary">
                  Created: {result.created}
                </span>
                {result.updated > 0 && (
                  <span className="px-3 py-1.5 rounded bg-blue-100 text-blue-700">Updated: {result.updated}</span>
                )}
                {result.skipped > 0 && (
                  <span className="px-3 py-1.5 rounded bg-yellow-100 text-yellow-700">Skipped: {result.skipped}</span>
                )}
                {result.errors.length > 0 && (
                  <span className="px-3 py-1.5 rounded bg-danger-subtle text-danger-primary">
                    Errors: {result.errors.length}
                  </span>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 max-h-40 overflow-y-auto">
                  <ul className="space-y-1 text-12 text-red-700">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={isSubmitting}
              disabled={!file || !defaultPassword || isSubmitting}
              onClick={() => void handleSubmit()}
            >
              Import
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
