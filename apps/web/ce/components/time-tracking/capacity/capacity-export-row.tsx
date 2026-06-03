/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Single table row for a capacity export job — status, range, members, rows, size,
 * timestamps and download action.
 */

import { Download } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { ICapacityExportJob } from "@plane/types";
import { CapacityExportStatusBadge } from "./capacity-export-status-badge";

type Props = {
  job: ICapacityExportJob;
};

function formatFileSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

export function CapacityExportRow({ job }: Props) {
  const { t } = useTranslation();
  const canDownload = job.status === "ready" && !job.is_expired && !!job.file_url;
  const membersLabel =
    !job.member_ids || job.member_ids.length === 0 ? t("capacity_exports.all_members") : String(job.member_count);
  const rowsLabel = typeof job.row_count === "number" ? String(job.row_count) : "—";

  return (
    <tr className="border-b border-subtle/60 transition-colors hover:bg-layer-1/60">
      <td className="px-4 py-2.5 whitespace-nowrap">
        <CapacityExportStatusBadge status={job.status} />
      </td>

      <td className="px-4 py-2.5 whitespace-nowrap text-13 text-primary">
        <span className="tabular-nums">{formatDate(job.date_from)}</span>
        <span className="mx-1.5 text-tertiary">→</span>
        <span className="tabular-nums">{formatDate(job.date_to)}</span>
      </td>

      <td className="px-4 py-2.5 whitespace-nowrap text-13 text-secondary text-right tabular-nums">{membersLabel}</td>

      <td className="px-4 py-2.5 whitespace-nowrap text-13 text-secondary text-right tabular-nums">{rowsLabel}</td>

      <td className="px-4 py-2.5 whitespace-nowrap text-13 text-secondary text-right tabular-nums">
        {formatFileSize(job.file_size)}
      </td>

      <td className="px-4 py-2.5 whitespace-nowrap text-13 text-tertiary tabular-nums">{formatDate(job.created_at)}</td>

      <td className="px-4 py-2.5 whitespace-nowrap text-13 text-tertiary tabular-nums">{formatDate(job.expires_at)}</td>

      <td className="px-4 py-2.5 whitespace-nowrap text-right">
        {canDownload ? (
          <a
            href={job.file_url!}
            download
            className="inline-flex items-center gap-1.5 rounded-md border border-accent-primary/30 bg-accent-primary/10 px-2.5 py-1 text-12 font-medium text-accent-primary transition-colors hover:border-accent-primary/40 hover:bg-accent-primary/15"
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
