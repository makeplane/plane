/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon } from "@plane/propel/icons";
import { convertBytesToSize } from "@plane/utils";
import type { TAttachmentPreviewItem } from "./attachment-preview.types";
import { AttachmentPreviewRenderer } from "./attachment-preview-renderer";

export type AttachmentPreviewDialogLabels = {
  ariaLabel: string;
  download: string;
  close: string;
  previous: string;
  next: string;
};

const DEFAULT_LABELS: AttachmentPreviewDialogLabels = {
  ariaLabel: "Attachment preview",
  download: "Download",
  close: "Close preview",
  previous: "Previous attachment",
  next: "Next attachment",
};

export type AttachmentPreviewDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  item: TAttachmentPreviewItem | null;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  renderPreview?: (item: TAttachmentPreviewItem) => ReactNode;
  labels?: Partial<AttachmentPreviewDialogLabels>;
};

export function AttachmentPreviewDialog({
  isOpen,
  onClose,
  item,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  renderPreview,
  labels: labelsProp,
}: AttachmentPreviewDialogProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };

  // Derive effective open state — prevents scroll lock / keydown when item is null
  const open = isOpen && !!item;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Skip arrow navigation when another handler already consumed the event (e.g. video seeking)
      if (e.defaultPrevented) return;
      if (e.key === "ArrowRight" && hasNext && onNext) onNext();
      if (e.key === "ArrowLeft" && hasPrevious && onPrevious) onPrevious();
    },
    [onClose, onNext, onPrevious, hasNext, hasPrevious]
  );

  const prevOverflowRef = useRef<string>("");

  useEffect(() => {
    if (!open) return;
    prevOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflowRef.current;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open, item?.id]);

  if (!open) return null;

  return createPortal(
    <div
      ref={dialogRef}
      className="fixed inset-0 z-100 flex flex-col bg-backdrop backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={labels.ariaLabel}
      tabIndex={-1}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3">
        {/* Left: title */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{item.name}</p>
          <p className="text-xs text-white/50">
            {item.extension.toUpperCase()}
            {item.size > 0 && <span className="ml-1.5">{convertBytesToSize(item.size)}</span>}
            {item.uploadedByLabel && <span className="ml-1.5">· {item.uploadedByLabel}</span>}
          </p>
        </div>

        {/* Right: download + close */}
        <div className="flex items-center gap-1">
          <a
            href={item.downloadSrc}
            download={item.name}
            className="flex items-center justify-center rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={labels.download}
            title={labels.download}
          >
            <DownloadIcon className="size-5" />
          </a>
          <IconButton
            icon={CloseIcon}
            variant="ghost"
            size="lg"
            onClick={onClose}
            aria-label={labels.close}
            className="text-white/70 hover:bg-white/10 hover:text-white"
            iconClassName="size-5"
          />
        </div>
      </div>

      {/* Preview body with nav arrows — click backdrop to close */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center p-8"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {hasPrevious && onPrevious && (
          <IconButton
            icon={ChevronLeftIcon}
            variant="ghost"
            size="xl"
            onClick={onPrevious}
            data-testid="preview-nav-previous"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
            iconClassName="size-6"
            aria-label={labels.previous}
          />
        )}

        {renderPreview ? renderPreview(item) : <AttachmentPreviewRenderer key={item.id} item={item} />}

        {hasNext && onNext && (
          <IconButton
            icon={ChevronRightIcon}
            variant="ghost"
            size="xl"
            onClick={onNext}
            data-testid="preview-nav-next"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
            iconClassName="size-6"
            aria-label={labels.next}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
