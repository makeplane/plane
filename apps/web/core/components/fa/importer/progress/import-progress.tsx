// [FA-CUSTOM] Import progress display with live polling

import type { UseImportWizardReturn } from "../hooks/use-import-wizard";

type Props = {
  wizard: UseImportWizardReturn;
};

export function ImportProgress({ wizard }: Props) {
  const job = wizard.importJob;
  const progress = job?.progress || 0;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="mb-2 flex items-center justify-between text-xs text-custom-text-300">
          <span>Importing issues...</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-custom-background-80">
          <div
            className="h-full rounded-full bg-custom-primary-100 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Live counters */}
      {job && (
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">{job.imported_count}</p>
            <p className="text-xs text-custom-text-300">Imported</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-amber-500">{job.skipped_count}</p>
            <p className="text-xs text-custom-text-300">Skipped</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-red-500">{job.error_count}</p>
            <p className="text-xs text-custom-text-300">Errors</p>
          </div>
        </div>
      )}

      <p className="text-xs text-custom-text-300">
        {job
          ? `Processing row ${job.imported_count + job.skipped_count} of ${job.total_rows}...`
          : "Starting import..."}
      </p>
    </div>
  );
}
