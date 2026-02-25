// [FA-CUSTOM] Import results and error log

import { useCallback } from "react";
import { CheckCircle, AlertTriangle, XCircle, Download } from "lucide-react";
import { Button } from "@plane/propel/button";
import type { UseImportWizardReturn } from "../hooks/use-import-wizard";

type Props = {
  wizard: UseImportWizardReturn;
  onClose: () => void;
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

  const isSuccess = job.status === "completed";
  const isPartial = job.status === "completed_with_errors";
  const isFailed = job.status === "failed";

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div
        className={`flex items-center gap-3 rounded-lg p-4 ${
          isSuccess
            ? "bg-green-500/10 text-green-600"
            : isPartial
              ? "bg-amber-500/10 text-amber-600"
              : "bg-red-500/10 text-red-600"
        }`}
      >
        {isSuccess && <CheckCircle className="size-5 shrink-0" />}
        {isPartial && <AlertTriangle className="size-5 shrink-0" />}
        {isFailed && <XCircle className="size-5 shrink-0" />}
        <div>
          <p className="text-sm font-medium">
            {isSuccess && "Import completed successfully!"}
            {isPartial && "Import completed with some errors."}
            {isFailed && "Import failed."}
          </p>
          <p className="text-xs opacity-80">
            {job.imported_count} imported, {job.skipped_count} skipped, {job.error_count} errors
          </p>
        </div>
      </div>

      {/* Result summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded border border-custom-border-200 p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{job.imported_count}</p>
          <p className="text-xs text-custom-text-300">Imported</p>
        </div>
        <div className="rounded border border-custom-border-200 p-3 text-center">
          <p className="text-2xl font-bold text-amber-500">{job.skipped_count}</p>
          <p className="text-xs text-custom-text-300">Skipped</p>
        </div>
        <div className="rounded border border-custom-border-200 p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{job.error_count}</p>
          <p className="text-xs text-custom-text-300">Errors</p>
        </div>
      </div>

      {/* Error log */}
      {job.error_log && job.error_log.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-custom-text-100">Error Log</h4>
            <Button variant="tertiary" size="sm" onClick={downloadErrorLog}>
              <Download className="mr-1 size-3.5" />
              Download CSV
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto rounded border border-custom-border-200">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-custom-background-80">
                  <th className="px-3 py-2 text-left font-medium text-custom-text-200">Row</th>
                  <th className="px-3 py-2 text-left font-medium text-custom-text-200">Error</th>
                </tr>
              </thead>
              <tbody>
                {job.error_log.slice(0, 50).map((entry, idx) => (
                  <tr key={idx} className="border-t border-custom-border-200">
                    <td className="whitespace-nowrap px-3 py-1.5 text-custom-text-300">{entry.row}</td>
                    <td className="px-3 py-1.5 text-custom-text-100">{entry.error}</td>
                  </tr>
                ))}
                {job.error_log.length > 50 && (
                  <tr className="border-t border-custom-border-200">
                    <td colSpan={2} className="px-3 py-2 text-center text-custom-text-300">
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
      <div className="flex justify-end border-t border-custom-border-200 pt-4">
        <Button variant="primary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
