"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useRef, useState } from "react";
import { FileSpreadsheet, ShieldCheck, UploadCloud, Users } from "lucide-react";
import { Button } from "@plane/propel/button";
import { useRoster } from "../store/roster-context";

const IMPORT_FIELDS = ["Player name", "Jersey #", "Position", "Height", "Weight", "Status"];
const SUPPORTED_FILES = ["XLSX", "CSV"];

export const RosterEmptyState = () => {
  const { canManage, openImportRosterModal, setPendingImportFile } = useRoster();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openImportWithFile = (file: File) => {
    setPendingImportFile(file);
    openImportRosterModal();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    openImportWithFile(file);
    event.currentTarget.value = "";
  };

  const handleFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    openImportWithFile(file);
  };

  return (
    <div className="flex min-h-[420px] flex-1 items-center justify-center py-6 sm:py-8">
      <div className="flex w-full max-w-3xl flex-col items-center rounded-2xl border border-custom-border-200 bg-custom-background-100 px-6 py-8 text-center shadow-sm sm:px-8 sm:py-10">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-custom-border-200 bg-custom-background-90 text-custom-primary-100">
          <Users className="h-9 w-9" />
          <div className="absolute -left-5 bottom-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-custom-border-200 bg-custom-background-80 text-custom-text-200 shadow-sm">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <div className="absolute -right-4 top-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-custom-border-200 bg-custom-background-80 text-custom-text-200 shadow-sm">
            <UploadCloud className="h-4 w-4" />
          </div>
          <div className="absolute -bottom-4 right-1 flex h-9 w-9 items-center justify-center rounded-2xl border border-custom-border-200 bg-custom-background-80 text-custom-text-200 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>

        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold text-custom-text-100 sm:text-2xl">No roster uploaded yet</h2>
          <p className="mt-2 text-sm leading-6 text-custom-text-300 sm:text-base">
            Import your team roster to organize player details, filter members, and manage the lineup for this program.
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row">
          {canManage ? (
            <Button variant="primary" size="sm" className="w-full sm:w-auto" prependIcon={<UploadCloud />} onClick={openImportRosterModal}>
              Import roster
            </Button>
          ) : null}
          <a
            href="/templates/roster-template.xlsx"
            download="roster-template.xlsx"
            className="inline-flex w-full items-center justify-center rounded px-4 py-1.5 text-xs font-medium text-custom-primary-100 transition-colors hover:text-custom-primary-200 sm:w-auto"
          >
            Download template
          </a>
        </div>

        <div className="mt-6 flex max-w-2xl flex-col items-center gap-3">
          <p className="text-xs text-custom-text-300 sm:text-sm">
            Start with the roster template, then upload a spreadsheet in the importer to preview rows before saving.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUPPORTED_FILES.map((format) => (
              <span
                key={format}
                className="rounded-full border border-custom-border-200 bg-custom-background-80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-custom-text-300"
              >
                {format}
              </span>
            ))}
            {IMPORT_FIELDS.map((field) => (
              <span
                key={field}
                className="rounded-full border border-custom-border-200 bg-custom-background-80 px-2.5 py-1 text-[11px] font-medium text-custom-text-300"
              >
                {field}
              </span>
            ))}
          </div>
        </div>

        <div
          className={`mt-6 w-full max-w-xl rounded-2xl border border-dashed px-5 py-6 transition-colors sm:px-6 ${
            isDragging
              ? "border-custom-primary-100 bg-custom-primary-100/10"
              : "border-custom-border-200 bg-custom-background-90"
          }`}
          onDragOver={(event) => {
            if (!canManage) return;
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={canManage ? handleFileDrop : undefined}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-custom-primary-100/10 text-custom-primary-100">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="mt-4 text-sm font-medium text-custom-text-100">Drag and drop a roster file here</div>
          <div className="mt-1 text-xs leading-5 text-custom-text-300 sm:text-sm">
            Drop a `.xlsx` or `.csv` file to open the importer with a preview, or choose a file manually.
          </div>
          {canManage ? (
            <div className="mt-4 flex justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button variant="neutral-primary" size="sm" onClick={() => fileInputRef.current?.click()}>
                Choose file
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
