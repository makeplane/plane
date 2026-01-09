"use client";

import { useEffect, useRef, useState } from "react";
import { FileImage, FileText, FileVideo, UploadCloud, X } from "lucide-react";
import { Button, ToggleSwitch } from "@plane/ui";
import type { TMediaItem } from "./media-items";
import { useMediaLibrary } from "./media-library-context";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

type TUploadItem = {
  id: string;
  file: File;
  status: "ready" | "failed";
  error?: string;
};

const getTitleFromFile = (fileName: string) => fileName.replace(/\.[^/.]+$/, "");

export const MediaLibraryUploadModal = () => {
  const { isUploadOpen, closeUpload, addUploadedItem } = useMediaLibrary();
  const [isDragging, setIsDragging] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [uploads, setUploads] = useState<TUploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
      const tooLarge = file.size > MAX_FILE_SIZE;
      return {
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        status: tooLarge ? "failed" : "ready",
        error: tooLarge ? "File exceeds 100MB limit" : undefined,
      } as TUploadItem;
    });
    setUploads((prev) => (allowMultiple ? [...prev, ...nextItems] : nextItems));
  };

  const handleUpload = async () => {
    const readyItems = uploads.filter((item) => item.status === "ready");
    if (readyItems.length === 0) return;
    const createdAt = new Date().toLocaleDateString("en-US");
    const uploadedAt = Date.now();
    for (const [index, item] of readyItems.entries()) {
      const file = item.file;
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const mediaType = isImage ? "image" : isVideo ? "video" : "document";
      const objectUrl = URL.createObjectURL(file);
      const newItem: TMediaItem = {
        id: `upload-${uploadedAt}-${index}-${file.name}`,
        title: getTitleFromFile(file.name) || "Untitled Upload",
        author: "You",
        createdAt,
        views: 0,
        duration: mediaType === "image" ? "Image" : mediaType === "video" ? "0:00" : "Document",
        primaryTag: "Game",
        secondaryTag: "Upload",
        itemsCount: 1,
        meta: {},
        mediaType,
        thumbnail: mediaType === "image" ? objectUrl : "",
        videoSrc: mediaType === "video" ? objectUrl : undefined,
        fileSrc: mediaType === "document" ? objectUrl : undefined,
        docs: ["Upload"],
      };
      await addUploadedItem(newItem, file);
    }
    setUploads([]);
    if (!allowMultiple) {
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

          {/* <div className="mt-4 flex flex-col gap-3 text-sm text-custom-text-200">
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
          </div> */}

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
                        {item.status === "ready" ? "Ready to upload" : item.error}
                      </div>
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
                              entry.id === item.id ? { ...entry, status: "ready", error: undefined } : entry
                            )
                          )
                        }
                      >
                        Retry
                      </Button>
                    ) : (
                      <div className="text-xs text-custom-primary-100">Ready</div>
                    )}
                    <Button
                      variant="neutral-primary"
                      size="sm"
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
          <span>Supported formats: All file types (Max size: 100MB)</span>
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
            <Button variant="primary" size="sm" onClick={handleUpload} disabled={uploads.length === 0}>
              Upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
