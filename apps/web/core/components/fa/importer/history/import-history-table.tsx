// [FA-CUSTOM] Import history table

import { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Loader } from "@plane/ui";
import { ImportService } from "@/services/import.service";
import type { TImportJob } from "@/services/import.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/10 text-green-600",
  completed_with_errors: "bg-amber-500/10 text-amber-600",
  failed: "bg-red-500/10 text-red-500",
  processing: "bg-blue-500/10 text-blue-500",
  queued: "bg-custom-background-80 text-custom-text-300",
  mapping: "bg-custom-background-80 text-custom-text-300",
  uploading: "bg-custom-background-80 text-custom-text-300",
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
      <div className="flex flex-col items-center gap-2 py-12 text-custom-text-300">
        <FileSpreadsheet className="size-10 opacity-50" />
        <p className="text-sm">No imports yet</p>
        <p className="text-xs">Click &quot;New Import&quot; to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-custom-border-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-custom-background-80">
            <th className="px-4 py-2 text-left font-medium text-custom-text-200">File</th>
            <th className="px-4 py-2 text-left font-medium text-custom-text-200">Source</th>
            <th className="px-4 py-2 text-left font-medium text-custom-text-200">Status</th>
            <th className="px-4 py-2 text-right font-medium text-custom-text-200">Imported</th>
            <th className="px-4 py-2 text-right font-medium text-custom-text-200">Errors</th>
            <th className="px-4 py-2 text-left font-medium text-custom-text-200">Date</th>
          </tr>
        </thead>
        <tbody>
          {imports.map((job) => (
            <tr key={job.id} className="border-t border-custom-border-200">
              <td className="px-4 py-2 text-custom-text-100">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="size-4 shrink-0 text-custom-text-300" />
                  <span className="max-w-[200px] truncate">{job.file_name}</span>
                </div>
              </td>
              <td className="px-4 py-2 text-custom-text-300 capitalize">{job.detected_preset || "—"}</td>
              <td className="px-4 py-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[job.status] || ""}`}
                >
                  {STATUS_LABELS[job.status] || job.status}
                </span>
              </td>
              <td className="px-4 py-2 text-right text-custom-text-100">
                {job.imported_count} / {job.total_rows}
              </td>
              <td className="px-4 py-2 text-right text-custom-text-300">{job.error_count}</td>
              <td className="px-4 py-2 text-custom-text-300">{new Date(job.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
