// [FA-CUSTOM] Import history table

import { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Badge } from "@plane/propel/badge";
import type { TBadgeVariant } from "@plane/propel/badge";
import { Loader } from "@plane/ui";
import { ImportService } from "@/services/import.service";
import type { TImportJob } from "@/services/import.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

const STATUS_BADGE_VARIANT: Record<string, TBadgeVariant> = {
  completed: "success",
  completed_with_errors: "warning",
  failed: "danger",
  processing: "brand",
  queued: "neutral",
  mapping: "neutral",
  uploading: "neutral",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  completed_with_errors: "Partial",
  failed: "Failed",
  processing: "Processing",
  queued: "Queued",
  mapping: "Mapping",
  uploading: "Uploading",
};

export function ImportHistoryTable({ workspaceSlug, projectId }: Props) {
  const importService = useMemo(() => new ImportService(), []);
  const [imports, setImports] = useState<TImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void importService
      .getImportHistory(workspaceSlug, projectId)
      .then((data) => {
        if (!cancelled) setImports(data);
        return undefined;
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, projectId, importService]);

  if (isLoading) {
    return (
      <Loader className="space-y-3">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );
  }

  if (imports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-tertiary">
        <FileSpreadsheet className="size-10 opacity-50" />
        <p className="text-body-xs-regular">No imports yet</p>
        <p className="text-caption-md-regular">Click &quot;New Import&quot; to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-subtle">
      <table className="min-w-full">
        <thead>
          <tr className="bg-layer-3">
            <th className="px-4 py-2 text-left text-caption-md-medium text-secondary">File</th>
            <th className="px-4 py-2 text-left text-caption-md-medium text-secondary">Source</th>
            <th className="px-4 py-2 text-left text-caption-md-medium text-secondary">Status</th>
            <th className="px-4 py-2 text-right text-caption-md-medium text-secondary">Imported</th>
            <th className="px-4 py-2 text-right text-caption-md-medium text-secondary">Errors</th>
            <th className="px-4 py-2 text-left text-caption-md-medium text-secondary">Date</th>
          </tr>
        </thead>
        <tbody>
          {imports.map((job) => (
            <tr key={job.id} className="border-t border-subtle">
              <td className="px-4 py-2 text-body-xs-regular text-primary">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="size-4 shrink-0 text-tertiary" />
                  <span className="max-w-[200px] truncate">{job.file_name}</span>
                </div>
              </td>
              <td className="px-4 py-2 text-body-xs-regular text-tertiary capitalize">{job.detected_preset || "—"}</td>
              <td className="px-4 py-2">
                <Badge variant={STATUS_BADGE_VARIANT[job.status] || "neutral"} size="sm">
                  {STATUS_LABELS[job.status] || job.status}
                </Badge>
              </td>
              <td className="px-4 py-2 text-right text-body-xs-regular text-primary">
                {job.imported_count} / {job.total_rows}
              </td>
              <td className="px-4 py-2 text-right text-body-xs-regular text-tertiary">{job.error_count}</td>
              <td className="px-4 py-2 text-body-xs-regular text-tertiary">
                {new Date(job.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
