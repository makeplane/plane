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
        <div className="mb-2 flex items-center justify-between text-caption-md-regular text-tertiary">
          <span>Importing issues...</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-layer-3">
          <div
            className="h-full rounded-full bg-accent-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Live counters */}
      {job && (
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-h4-medium text-success-primary">{job.imported_count}</p>
            <p className="text-caption-md-regular text-tertiary">Imported</p>
          </div>
          <div className="text-center">
            <p className="text-h4-medium text-warning-primary">{job.skipped_count}</p>
            <p className="text-caption-md-regular text-tertiary">Skipped</p>
          </div>
          <div className="text-center">
            <p className="text-h4-medium text-danger-primary">{job.error_count}</p>
            <p className="text-caption-md-regular text-tertiary">Errors</p>
          </div>
        </div>
      )}

      <p className="text-caption-md-regular text-tertiary">
        {job
          ? `Processing row ${job.imported_count + job.skipped_count} of ${job.total_rows}...`
          : "Starting import..."}
      </p>
    </div>
  );
}
