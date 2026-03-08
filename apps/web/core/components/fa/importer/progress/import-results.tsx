// [FA-CUSTOM] Import results and error log

import { useCallback } from "react";
import { CheckCircle, AlertTriangle, XCircle, Download } from "lucide-react";
import { Button } from "@plane/propel/button";
import { cn } from "@plane/utils";
import type { UseImportWizardReturn } from "../hooks/use-import-wizard";

type Props = {
  wizard: UseImportWizardReturn;
  onClose: () => void;
};

const STATUS_BANNER_STYLES: Record<string, string> = {
  completed: "bg-success-subtle-1 text-success-primary",
  completed_with_errors: "bg-warning-subtle text-warning-primary",
  failed: "bg-danger-subtle text-danger-primary",
};

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  completed: CheckCircle,
  completed_with_errors: AlertTriangle,
  failed: XCircle,
};

const STATUS_MESSAGES: Record<string, string> = {
  completed: "Import completed successfully!",
  completed_with_errors: "Import completed with some errors.",
  failed: "Import failed.",
};

export function ImportResults({ wizard, onClose }: Props) {
  const job = wizard.importJob;

  const downloadErrorLog = useCallback(() => {
    if (!job?.error_log?.length) return;
    const csv = [
      ["Row", "Error", "Data"],
      ...job.error_log.map((entry) => [String(entry.row), entry.error, JSON.stringify(entry.data)]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${job.token.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [job]);

  if (!job) return null;

  const StatusIcon = STATUS_ICONS[job.status] ?? XCircle;

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg p-4",
          STATUS_BANNER_STYLES[job.status] ?? STATUS_BANNER_STYLES.failed
        )}
      >
        <StatusIcon className="size-5 shrink-0" />
        <div>
          <p className="text-body-sm-medium">{STATUS_MESSAGES[job.status] ?? "Import failed."}</p>
          <p className="text-caption-md-regular opacity-80">
            {job.imported_count} imported, {job.skipped_count} skipped, {job.error_count} errors
          </p>
        </div>
      </div>

      {/* Result summary */}
      <div className="grid grid-cols-3 gap-3">
        <ResultCard label="Imported" value={job.imported_count} colorClass="text-success-primary" />
        <ResultCard label="Skipped" value={job.skipped_count} colorClass="text-warning-primary" />
        <ResultCard label="Errors" value={job.error_count} colorClass="text-danger-primary" />
      </div>

      {/* Error log */}
      {!!job.error_log?.length && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-body-sm-medium text-primary">Error Log</h4>
            <Button variant="tertiary" size="sm" onClick={downloadErrorLog}>
              <Download className="mr-1 size-3.5" />
              Download CSV
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-subtle">
            <table className="min-w-full">
              <thead>
                <tr className="bg-layer-3">
                  <th className="px-3 py-2 text-left text-caption-md-medium text-secondary">Row</th>
                  <th className="px-3 py-2 text-left text-caption-md-medium text-secondary">Error</th>
                </tr>
              </thead>
              <tbody>
                {job.error_log.slice(0, 50).map((entry, idx) => (
                  <tr key={idx} className="border-t border-subtle">
                    <td className="whitespace-nowrap px-3 py-1.5 text-caption-md-regular text-tertiary">{entry.row}</td>
                    <td className="px-3 py-1.5 text-caption-md-regular text-primary">{entry.error}</td>
                  </tr>
                ))}
                {job.error_log.length > 50 && (
                  <tr className="border-t border-subtle">
                    <td colSpan={2} className="px-3 py-2 text-center text-caption-md-regular text-tertiary">
                      ... and {job.error_log.length - 50} more errors (download CSV for full log)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end border-t border-subtle pt-4">
        <Button variant="primary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

function ResultCard({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className="rounded-lg border border-subtle p-3 text-center">
      <p className={cn("text-h3-medium", colorClass)}>{value}</p>
      <p className="text-caption-md-regular text-tertiary">{label}</p>
    </div>
  );
}
