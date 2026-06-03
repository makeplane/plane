/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CheckCircle2, Clock, Loader2, XCircle, Archive } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { THoExportJobStatus } from "@/plane-web/services/ho-issue.service";

type Props = { status: THoExportJobStatus };

const STATUS_META: Record<THoExportJobStatus, { className: string; Icon: typeof CheckCircle2; spin?: boolean }> = {
  queued: { className: "bg-warning-subtle text-warning-primary border border-warning-primary/25", Icon: Clock },
  processing: {
    className: "bg-warning-subtle text-warning-primary border border-warning-primary/25",
    Icon: Loader2,
    spin: true,
  },
  ready: { className: "bg-success-subtle text-success-primary border border-success-primary/25", Icon: CheckCircle2 },
  failed: { className: "bg-danger-subtle text-danger-primary border border-danger-primary/25", Icon: XCircle },
  expired: { className: "bg-surface-2 text-tertiary border border-subtle", Icon: Archive },
};

export function HoExportStatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const { className, Icon, spin } = STATUS_META[status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-12 font-medium ${className}`}>
      <Icon className={`h-3 w-3 ${spin ? "animate-spin" : ""}`} />
      {t(`capacity_exports.status.${status}`)}
    </span>
  );
}
