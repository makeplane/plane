// [FA-CUSTOM] Step 2: Map file columns to Plane fields

import { Button } from "@plane/propel/button";
import { CustomSearchSelect } from "@plane/ui";
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

  const columnOptions = [
    { value: "", query: "skip", content: <span className="text-tertiary">— Skip —</span> },
    ...columns.map((col) => ({
      value: col,
      query: col,
      content: <span className="text-primary">{col}</span>,
    })),
  ];

  return (
    <div className="space-y-4">
      <p className="text-body-xs-regular text-tertiary">
        Map each column from your file to the corresponding Plane field. Only <strong>Title</strong> is required.
      </p>

      <div className="space-y-2">
        {PLANE_FIELDS.map((field) => (
          <div key={field.key} className="flex items-center gap-4 rounded-lg px-3 py-2 hover:bg-layer-3">
            <div className="w-40 shrink-0">
              <span className="text-body-sm-medium text-primary">
                {field.label}
                {field.required && <span className="ml-1 text-danger-primary">*</span>}
              </span>
            </div>
            <div className="text-tertiary">&rarr;</div>
            <CustomSearchSelect
              value={columnMapping[field.key] || ""}
              onChange={(val: string) => handleChange(field.key, val)}
              label={
                <span className={columnMapping[field.key] ? "text-primary" : "text-tertiary"}>
                  {columnMapping[field.key] || "— Skip —"}
                </span>
              }
              options={columnOptions}
              input
              maxHeight="md"
              buttonClassName="w-full"
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-subtle pt-4">
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
