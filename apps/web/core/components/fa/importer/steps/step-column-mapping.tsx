// [FA-CUSTOM] Step 2: Map file columns to Plane fields

import { Button } from "@plane/propel/button";
import type { UseImportWizardReturn } from "../hooks/use-import-wizard";

type Props = {
  wizard: UseImportWizardReturn;
};

const PLANE_FIELDS = [
  { key: "title", label: "Title", required: true },
  { key: "description", label: "Description", required: false },
  { key: "status", label: "Status", required: false },
  { key: "priority", label: "Priority", required: false },
  { key: "assignee", label: "Assignee", required: false },
  { key: "due_date", label: "Due Date", required: false },
  { key: "start_date", label: "Start Date", required: false },
  { key: "labels", label: "Labels", required: false },
  { key: "parent_task_id", label: "Parent Task ID", required: false },
  { key: "external_id", label: "External ID", required: false },
] as const;

export function StepColumnMapping({ wizard }: Props) {
  const { uploadData, columnMapping, setColumnMapping } = wizard;
  if (!uploadData) return null;

  const columns = uploadData.detected_columns;

  const handleChange = (planeField: string, fileColumn: string) => {
    setColumnMapping((prev) => {
      const next = { ...prev };
      if (fileColumn === "") {
        delete next[planeField];
      } else {
        next[planeField] = fileColumn;
      }
      return next;
    });
  };

  const isTitleMapped = !!columnMapping.title;

  return (
    <div className="space-y-4">
      <p className="text-sm text-custom-text-300">
        Map each column from your file to the corresponding Plane field. Only <strong>Title</strong> is required.
      </p>

      <div className="space-y-2">
        {PLANE_FIELDS.map((field) => (
          <div key={field.key} className="flex items-center gap-4 rounded px-3 py-2 hover:bg-custom-background-80">
            <div className="w-40 shrink-0">
              <span className="text-sm text-custom-text-100">
                {field.label}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </span>
            </div>
            <div className="text-custom-text-300">&rarr;</div>
            <select
              value={columnMapping[field.key] || ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full rounded border border-custom-border-200 bg-custom-background-100 px-3 py-1.5 text-sm text-custom-text-100"
            >
              <option value="">— Skip —</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-custom-border-200 pt-4">
        <Button variant="tertiary" size="sm" onClick={() => wizard.setStep("upload")}>
          Back
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={!isTitleMapped || wizard.isLoading}
          loading={wizard.isLoading}
          onClick={() => void wizard.saveAndAdvance("status_mapping")}
        >
          Next: Map Statuses
        </Button>
      </div>
    </div>
  );
}
