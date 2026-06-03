/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Download } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { THoExportJob } from "@/plane-web/services/ho-issue.service";
import { HoExportStatusBadge } from "./ho-export-status-badge";

type Props = { job: THoExportJob };

function formatFileSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string | null | undefined, includeTime = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (includeTime) {
    return d
      .toLocaleString("sv-SE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace("T", " ");
  }
  return d.toLocaleDateString("sv-SE");
}

export function HoExportRow({ job }: Props) {
  const { t } = useTranslation();
  const isExpired = job.expires_at ? new Date(job.expires_at) < new Date() : false;
  const canDownload = job.status === "ready" && !isExpired && !!job.file_url;

  return (
    <tr className="border-b border-subtle/60 transition-colors hover:bg-layer-1/60">
      <td className="px-4 py-2.5 whitespace-nowrap">
        <HoExportStatusBadge status={job.status} />
      </td>

      <td className="px-4 py-2.5 text-13 whitespace-nowrap text-primary">
        <span className="tabular-nums">{formatDate(job.filters.from_date)}</span>
        <span className="mx-1.5 text-tertiary">→</span>
        <span className="tabular-nums">{formatDate(job.filters.to_date)}</span>
      </td>

      <td className="px-4 py-2.5 text-right text-13 whitespace-nowrap text-secondary tabular-nums">
        {typeof job.row_count === "number" ? String(job.row_count) : "—"}
      </td>

      <td className="px-4 py-2.5 text-right text-13 whitespace-nowrap text-secondary tabular-nums">
        {formatFileSize(job.file_size)}
      </td>

      <td className="px-4 py-2.5 text-13 whitespace-nowrap text-tertiary tabular-nums">
        {formatDate(job.created_at, true)}
      </td>

      <td className="px-4 py-2.5 text-13 whitespace-nowrap text-tertiary tabular-nums">{formatDate(job.expires_at)}</td>

      <td className="px-4 py-2.5 text-right whitespace-nowrap">
        {canDownload ? (
          <a
            href={job.file_url!}
            download
            className="border-accent-primary/30 hover:border-accent-primary/40 inline-flex items-center gap-1.5 rounded-md border bg-accent-primary/10 px-2.5 py-1 text-12 font-medium text-accent-primary transition-colors hover:bg-accent-primary/15"
          >
            <Download className="h-3 w-3" />
            {t("capacity_exports.download")}
          </a>
        ) : (
          <span className="text-12 text-tertiary">—</span>
        )}
      </td>
    </tr>
  );
}
