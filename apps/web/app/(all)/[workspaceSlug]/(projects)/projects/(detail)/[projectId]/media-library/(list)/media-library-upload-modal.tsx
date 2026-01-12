"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { FileImage, FileText, FileVideo, UploadCloud, X } from "lucide-react";
import { Button, ToggleSwitch } from "@plane/ui";
import { useInstance } from "@/hooks/store/use-instance";
import { MediaLibraryService } from "@/services/media-library.service";
import { useMediaLibrary } from "./media-library-context";

const DEFAULT_MEDIA_LIBRARY_MAX_FILE_SIZE = 1024 * 1024 * 1024;
const IMAGE_FORMATS = new Set(["jpg", "jpeg", "png", "svg"]);
const VIDEO_FORMATS = new Set(["mp4", "m3u8"]);
const DOC_FORMATS = new Set(["json", "csv", "pdf", "docx", "xlsx", "pptx", "txt"]);

type TUploadItem = {
  id: string;
  file: File;
  status: "ready" | "uploading" | "failed";
  progress?: number;
  error?: string;
};

const getTitleFromFile = (fileName: string) => fileName.replace(/\.[^/.]+$/, "");
const getFileExtension = (fileName: string) => fileName.split(".").pop()?.toLowerCase() ?? "";

const buildArtifactName = (fileName: string, uploadedAt: number, index: number) => {
  const base = getTitleFromFile(fileName)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  const suffix = `${uploadedAt}-${index}`;
  return base ? `${base}-${suffix}` : `artifact-${suffix}`;
};

const resolveArtifactFormat = (fileName: string) => {
  const extension = getFileExtension(fileName);
  if (IMAGE_FORMATS.has(extension)) return extension;
  if (VIDEO_FORMATS.has(extension)) return extension;
  if (DOC_FORMATS.has(extension)) return extension;
  return "";
};

const updateUploadEntry = (
  prev: TUploadItem[],
  id: string,
  updates: Partial<TUploadItem>
): TUploadItem[] => prev.map((item) => (item.id === id ? { ...item, ...updates } : item));

const formatFileSize = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "0MB";
  const sizeInMb = value / (1024 * 1024);
  if (sizeInMb >= 1024) {
    const sizeInGb = sizeInMb / 1024;
    return `${sizeInGb.toFixed(sizeInGb >= 10 ? 0 : 1)}GB`;
  }
  return `${sizeInMb.toFixed(0)}MB`;
};

export const MediaLibraryUploadModal = () => {
  const { isUploadOpen, closeUpload, refreshLibrary } = useMediaLibrary();
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  const { config } = useInstance();
  const [isDragging, setIsDragging] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [uploads, setUploads] = useState<TUploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);
  const maxFileSize = config?.media_library_file_size_limit ?? DEFAULT_MEDIA_LIBRARY_MAX_FILE_SIZE;
  const maxSizeLabel = formatFileSize(maxFileSize);
  const hasUploading = uploads.some((item) => item.status === "uploading");

  const handleClose = () => {
    setUploads([]);
    setIsDragging(false);
    if (inputRef.current) inputRef.current.value = "";
    closeUpload();
  };

  useEffect(() => {
    if (isUploadOpen) {
      setAllowMultiple(false);
    }
  }, [isUploadOpen]);

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;
    const filesToAdd = allowMultiple ? files : files.slice(0, 1);
    const nextItems = filesToAdd.map((file) => {
      const tooLarge = file.size > maxFileSize;
      const unsupported = !resolveArtifactFormat(file.name);
      return {
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        status: tooLarge || unsupported ? "failed" : "ready",
        progress: 0,
        error: tooLarge ? `File exceeds ${maxSizeLabel} limit` : unsupported ? "Unsupported file type" : undefined,
      } as TUploadItem;
    });
    setUploads((prev) => (allowMultiple ? [...prev, ...nextItems] : nextItems));
  };

  const handleUpload = async () => {
    const readyItems = uploads.filter((item) => item.status === "ready");
    if (readyItems.length === 0 || !workspaceSlug || !projectId) return;
    const failedItems = uploads.filter((item) => item.status === "failed");
    const uploadedAt = Date.now();
    let packageId: string | null = null;

    try {
      const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
      packageId = typeof manifest?.id === "string" ? manifest.id : null;
    } catch {
      setUploads(
        readyItems.map((item) => ({
          ...item,
          status: "failed",
          error: "Unable to initialize media library",
        }))
      );
      return;
    }

    if (!packageId) {
      setUploads(
        readyItems.map((item) => ({
          ...item,
          status: "failed",
          error: "Media library package not available",
        }))
      );
      return;
    }

    let successCount = 0;
    for (const [index, item] of readyItems.entries()) {
      const file = item.file;
      const format = resolveArtifactFormat(file.name);
      if (!format) {
        failedItems.push({
          ...item,
          status: "failed",
          error: "Unsupported file type",
        });
        continue;
      }

      const artifactName = buildArtifactName(file.name, uploadedAt, index);
      const title = getTitleFromFile(file.name) || "Untitled Upload";
      const action = VIDEO_FORMATS.has(format) ? "play" : IMAGE_FORMATS.has(format) ? "view" : "download";
      try {
        setUploads((prev) => updateUploadEntry(prev, item.id, { status: "uploading", progress: 0 }));
        await mediaLibraryService.uploadArtifact(
          workspaceSlug,
          projectId,
          packageId,
          {
            name: artifactName,
            title,
            format,
            link: null,
            action,
            meta: { category: "Uploads", source: "web" },
          },
          file,
          (progressEvent) => {
            const total = progressEvent.total ?? 0;
            if (!total) return;
            const percent = Math.min(100, Math.round((progressEvent.loaded / total) * 100));
            setUploads((prev) => updateUploadEntry(prev, item.id, { progress: percent, status: "uploading" }));
          }
        );
        setUploads((prev) => updateUploadEntry(prev, item.id, { progress: 100 }));
        successCount += 1;
      } catch {
        failedItems.push({
          ...item,
          status: "failed",
          error: "Upload failed",
        });
        setUploads((prev) => updateUploadEntry(prev, item.id, { status: "failed", error: "Upload failed" }));
      }
    }

    if (successCount > 0) refreshLibrary();
    setUploads(failedItems);
    if (!allowMultiple && failedItems.length === 0) {
      handleClose();
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <FileImage className="h-5 w-5 text-custom-text-300" />;
    if (file.type.startsWith("video/")) return <FileVideo className="h-5 w-5 text-custom-text-300" />;
    return <FileText className="h-5 w-5 text-custom-text-300" />;
  };

  if (!isUploadOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-custom-border-200 bg-custom-background-100 shadow-lg">
        <div className="flex items-center justify-between border-b border-custom-border-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-custom-text-100">Upload Files</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-custom-text-300 hover:text-custom-text-100"
            aria-label="Close upload"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <div
            className={`rounded-lg border border-dashed px-4 py-8 text-center transition ${
              isDragging
                ? "border-custom-primary-100 bg-custom-primary-100/10"
                : "border-custom-border-200 bg-custom-background-90"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              addFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <UploadCloud className="mx-auto h-10 w-10 text-custom-text-300" />
            <div className="mt-2 text-sm font-medium text-custom-text-100">Drag and drop your files here</div>
            <div className="mt-1 text-xs text-custom-text-300">or</div>
            <Button variant="primary" size="sm" className="mt-3" onClick={() => inputRef.current?.click()}>
              Browse Files
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="*/*"
              multiple={allowMultiple}
              className="hidden"
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                event.currentTarget.value = "";
              }}
            />
          </div>

          <hr className="my-4 border-0 border-t border-custom-border-200/60" />
{/* 
         <div className="mt-4 flex flex-col gap-3 text-sm text-custom-text-200">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-custom-text-300">Title</span>
              <input
                type="text"
                value={title}
                placeholder="Use a custom title or keep the file name"
                onChange={(event) => setTitle(event.target.value)}
                className="h-9 rounded-md border border-custom-border-200 bg-custom-background-100 px-3 text-sm text-custom-text-100"
              />
            </label>
          </div>  */}

          <div className="mt-4 rounded-lg border border-custom-border-200">
            {uploads.length === 0 ? (
              <div className="px-4 py-3 text-xs text-custom-text-300">No files selected.</div>
            ) : (
              uploads.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-custom-border-200 px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(item.file)}
                    <div>
                      <div className="text-xs text-custom-text-300">
                        {item.status === "uploading"
                          ? `Uploading... ${item.progress ?? 0}%`
                          : item.status === "ready"
                          ? "Ready to upload"
                          : item.error}
                      </div>
                      {item.status === "uploading" ? (
                        <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-custom-border-200">
                          <div
                            className="h-full rounded-full bg-custom-primary-100 transition-[width]"
                            style={{ width: `${item.progress ?? 0}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "failed" ? (
                      <Button
                        variant="neutral-primary"
                        size="sm"
                        onClick={() =>
                          setUploads((prev) =>
                            prev.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, status: "ready", error: undefined, progress: 0 }
                                : entry
                            )
                          )
                        }
                      >
                        Retry
                      </Button>
                    ) : (
                      <div className="text-xs text-custom-primary-100">
                        {item.status === "uploading" ? "Uploading" : "Ready"}
                      </div>
                    )}
                    <Button
                      variant="neutral-primary"
                      size="sm"
                      disabled={item.status === "uploading"}
                      onClick={() => setUploads((prev) => prev.filter((entry) => entry.id !== item.id))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <hr className="my-4 border-0 border-t border-custom-border-200/60" />

          {/* Uploaded files list hidden by request */}
        </div>

        <div className="flex items-center justify-between border-t border-custom-border-200 px-5 py-3 text-xs text-custom-text-300">
          <span>
            Supported formats: MP4, M3U8, JPG, PNG, SVG, PDF, CSV, JSON, DOCX, XLSX, PPTX, TXT (Max size:{" "}
            {maxSizeLabel})
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-custom-text-300">Upload more</span>
              <ToggleSwitch
                value={allowMultiple}
                onChange={() =>
                  setAllowMultiple((prev) => {
                    const next = !prev;
                    if (!next && uploads.length > 1) {
                      setUploads([uploads[0]]);
                    }
                    return next;
                  })
                }
                size="sm"
              />
            </div>
            <Button variant="neutral-primary" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpload}
              disabled={hasUploading || !uploads.some((item) => item.status === "ready")}
            >
              Upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
