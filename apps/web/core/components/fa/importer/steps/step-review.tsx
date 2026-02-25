// [FA-CUSTOM] Step 5: Review summary and start import

import { Button } from "@plane/propel/button";
import type { UseImportWizardReturn } from "../hooks/use-import-wizard";

type Props = {
  wizard: UseImportWizardReturn;
};

export function StepReview({ wizard }: Props) {
  const { uploadData, columnMapping, statusMapping, assigneeMapping } = wizard;
  if (!uploadData) return null;

  const mappedColumns = Object.entries(columnMapping).filter(([, v]) => v);
  const mappedStatuses = Object.keys(statusMapping).length;
  const mappedAssignees = Object.keys(assigneeMapping).length;
  const totalStatuses = uploadData.unique_statuses?.length || 0;
  const totalAssignees = uploadData.unique_assignees?.length || 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-custom-text-300">Review your import configuration before starting.</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total Rows" value={uploadData.total_rows} />
        <SummaryCard label="Columns Mapped" value={`${mappedColumns.length} fields`} />
        <SummaryCard label="Statuses Mapped" value={`${mappedStatuses} / ${totalStatuses}`} />
        <SummaryCard label="Assignees Mapped" value={`${mappedAssignees} / ${totalAssignees}`} />
      </div>

      {/* Column mapping summary */}
      <div className="rounded border border-custom-border-200 p-3">
        <h4 className="mb-2 text-xs font-medium uppercase text-custom-text-300">Column Mappings</h4>
        <div className="space-y-1">
          {mappedColumns.map(([planeField, fileCol]) => (
            <div key={planeField} className="flex items-center gap-2 text-xs">
              <span className="w-28 shrink-0 font-medium text-custom-text-100">{planeField}</span>
              <span className="text-custom-text-300">&larr;</span>
              <span className="text-custom-text-200">{fileCol}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error display */}
      {wizard.error && <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500">{wizard.error}</div>}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-custom-border-200 pt-4">
        <Button variant="tertiary" size="sm" onClick={() => wizard.setStep("assignee_mapping")}>
          Back
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={wizard.isLoading}
          loading={wizard.isLoading}
          onClick={() => void wizard.startImport()}
        >
          Start Import
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-custom-border-200 p-3">
      <p className="text-xs text-custom-text-300">{label}</p>
      <p className="mt-1 text-lg font-semibold text-custom-text-100">{value}</p>
    </div>
  );
}
