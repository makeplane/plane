/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import type { IImporterImportedData } from "@plane/types";
import { cn } from "@plane/ui";

type Props = {
  status: string;
  importedData?: IImporterImportedData | null;
  className?: string;
};

const PHASE_I18N_KEYS: Record<string, string> = {
  queued: "workspace_settings.settings.imports.progress.queued",
  extracting: "workspace_settings.settings.imports.progress.extracting",
  setup: "workspace_settings.settings.imports.progress.setup",
  tasks: "workspace_settings.settings.imports.progress.tasks",
  testcases: "workspace_settings.settings.imports.progress.testcases",
  comments: "workspace_settings.settings.imports.progress.comments",
  attachments: "workspace_settings.settings.imports.progress.attachments",
  relations: "workspace_settings.settings.imports.progress.relations",
  documents: "workspace_settings.settings.imports.progress.documents",
};

export function ImportProgress(props: Props) {
  const { status, importedData, className } = props;
  const { t } = useTranslation();

  if (status === "failed") {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <span className="text-danger-primary capitalize">{status}</span>
        {importedData?.error && <span className="line-clamp-2 text-11 text-secondary">{importedData.error}</span>}
      </div>
    );
  }

  if (status !== "processing" && status !== "queued") {
    return <span className={cn("capitalize", className)}>{status}</span>;
  }

  const progress = importedData?.progress;
  const phase = status === "queued" ? "queued" : (progress?.phase ?? "setup");
  const percent = status === "queued" ? 0 : Math.min(100, Math.max(0, progress?.percent ?? 0));
  const phaseLabel = t(PHASE_I18N_KEYS[phase] ?? PHASE_I18N_KEYS.setup);

  return (
    <div className={cn("flex min-w-[10rem] flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2 text-11 text-secondary">
        <span className="truncate">{phaseLabel}</span>
        <span className="shrink-0 tabular-nums">{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent-primary transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      {progress && progress.total > 0 && (
        <span className="text-11 text-tertiary tabular-nums">
          {progress.completed.toLocaleString()} / {progress.total.toLocaleString()}
        </span>
      )}
    </div>
  );
}
