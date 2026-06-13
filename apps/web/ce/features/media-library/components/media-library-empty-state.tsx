"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useRef, useState } from "react";
import { ArrowRight, FileImage, FileText, FileVideo, FolderOpen, UploadCloud } from "lucide-react";
import { Button } from "@plane/propel/button";
import { useMediaLibrary } from "../store/media-library-context";

const SUPPORTED_FORMATS = ["JPEG", "PNG", "MP4", "HLS", "PDF", "CSV", "XLSX", "DOCX", "PPTX", "TXT"];

export const MediaLibraryEmptyState = () => {
  const { openUpload, setPendingUploadFiles } = useMediaLibrary();
  const formatsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openUploadWithFiles = (files: File[]) => {
    if (files.length === 0) return;
    setPendingUploadFiles(files);
    openUpload();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    openUploadWithFiles(Array.from(event.target.files ?? []));
    event.currentTarget.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    openUploadWithFiles(Array.from(event.dataTransfer.files ?? []));
  };

  return (
    <div className="flex min-h-[420px] flex-1 items-center justify-center py-6 sm:py-8">
      <div className="flex w-full max-w-3xl flex-col items-center rounded-2xl border border-custom-border-200 bg-custom-background-100 px-6 py-8 text-center shadow-sm sm:px-8 sm:py-10">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-custom-border-200 bg-custom-background-90 text-custom-primary-100">
          <FolderOpen className="h-9 w-9" />
          <div className="absolute -left-5 bottom-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-custom-border-200 bg-custom-background-80 text-custom-text-200 shadow-sm">
            <FileImage className="h-4 w-4" />
          </div>
          <div className="absolute -right-4 top-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-custom-border-200 bg-custom-background-80 text-custom-text-200 shadow-sm">
            <FileVideo className="h-4 w-4" />
          </div>
          <div className="absolute -bottom-4 right-1 flex h-9 w-9 items-center justify-center rounded-2xl border border-custom-border-200 bg-custom-background-80 text-custom-text-200 shadow-sm">
            <FileText className="h-4 w-4" />
          </div>
        </div>

        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold text-custom-text-100 sm:text-2xl">No media uploaded yet</h2>
          <p className="mt-2 text-sm leading-6 text-custom-text-300 sm:text-base">
            Upload images, videos, or other media files to organize and manage them here for this program.
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row">
          <Button variant="primary" size="sm" className="w-full sm:w-auto" prependIcon={<UploadCloud />} onClick={openUpload}>
            Upload media
          </Button>
          <Button
            variant="link-primary"
            size="sm"
            className="w-full sm:w-auto"
            appendIcon={<ArrowRight />}
            onClick={() => formatsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          >
            Browse supported formats
          </Button>
        </div>

        <div ref={formatsRef} className="mt-6 flex max-w-2xl flex-col items-center gap-3" tabIndex={-1}>
          <p className="text-xs text-custom-text-300 sm:text-sm">
            Drag and drop files in the upload flow or use the upload button to add your first assets.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUPPORTED_FORMATS.map((format) => (
              <span
                key={format}
                className="rounded-full border border-custom-border-200 bg-custom-background-80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-custom-text-300"
              >
                {format}
              </span>
            ))}
            <span className="rounded-full border border-custom-border-200 bg-custom-background-80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-custom-text-300">
              Up to 1 GB
            </span>
          </div>
        </div>

        <div
          className={`mt-6 w-full max-w-xl rounded-2xl border border-dashed px-5 py-6 transition-colors sm:px-6 ${
            isDragging
              ? "border-custom-primary-100 bg-custom-primary-100/10"
              : "border-custom-border-200 bg-custom-background-90"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-custom-primary-100/10 text-custom-primary-100">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="mt-4 text-sm font-medium text-custom-text-100">Drag and drop files here</div>
          <div className="mt-1 text-xs leading-5 text-custom-text-300 sm:text-sm">
            Drop files to open the uploader with them preselected, or choose files manually.
          </div>
          <div className="mt-4 flex justify-center">
            <input
              ref={inputRef}
              type="file"
              accept=".mp4,.m3u8,video/mp4,application/vnd.apple.mpegurl,application/x-mpegurl,image/*,application/pdf,text/csv,application/json,.docx,.xlsx,.pptx,.txt"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="neutral-primary" size="sm" onClick={() => inputRef.current?.click()}>
              Choose files
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
