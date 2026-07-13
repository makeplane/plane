/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useSyncExternalStore } from "react";
import { AlertTriangle, CheckCircle2, Download, Loader2, X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// local imports
import { downloadManager } from "./download-manager";

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Persistent feedback for ZIP exports: floats bottom-right over the module
 * and survives the ephemeral toasts, showing live progress, completion and
 * errors until the user dismisses each entry.
 */
export function DownloadsPanel() {
  const { t } = useTranslation();
  const items = useSyncExternalStore(downloadManager.subscribe, downloadManager.getSnapshot, downloadManager.getSnapshot);

  if (items.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-[40] w-80 max-w-[calc(100vw-2rem)] space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex items-center gap-2.5 rounded-lg border bg-surface-1 px-3 py-2.5 shadow-raised-200",
            item.status === "error" ? "border-danger-strong" : "border-subtle"
          )}
        >
          {item.status === "done" ? (
            <CheckCircle2 className="size-4 shrink-0 text-success-primary" />
          ) : item.status === "error" ? (
            <AlertTriangle className="size-4 shrink-0 text-danger-primary" />
          ) : (
            <Loader2 className="size-4 shrink-0 animate-spin text-accent-primary" />
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-12 font-medium">
              <Download className="size-3 shrink-0 text-tertiary" />
              {item.label}
            </p>
            <p className="text-11 text-tertiary">
              {item.status === "preparing" && t("file_library.downloads.preparing")}
              {item.status === "downloading" &&
                t("file_library.downloads.progress", { size: formatBytes(item.receivedBytes) })}
              {item.status === "done" && t("file_library.downloads.done")}
              {item.status === "error" && t("file_library.downloads.error")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadManager.dismiss(item.id)}
            className="shrink-0 rounded-sm p-1 text-tertiary hover:bg-layer-1-hover"
            aria-label={t("close")}
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
