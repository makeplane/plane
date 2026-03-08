// [FA-CUSTOM] 5-step import wizard container

import { X } from "lucide-react";
import { cn } from "@plane/utils";
import { useImportWizard } from "./hooks/use-import-wizard";
import type { ImportWizardStep } from "./hooks/use-import-wizard";
import { ImportProgress } from "./progress/import-progress";
import { ImportResults } from "./progress/import-results";
import { StepAssigneeMapping } from "./steps/step-assignee-mapping";
import { StepColumnMapping } from "./steps/step-column-mapping";
import { StepReview } from "./steps/step-review";
import { StepStatusMapping } from "./steps/step-status-mapping";
import { StepUpload } from "./steps/step-upload";

const STEPS: { key: ImportWizardStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "column_mapping", label: "Map Columns" },
  { key: "status_mapping", label: "Map Statuses" },
  { key: "assignee_mapping", label: "Map Assignees" },
  { key: "review", label: "Review & Import" },
];

type Props = {
  workspaceSlug: string;
  projectId: string;
  onClose: () => void;
};

function getStepIndicatorStyle(idx: number, currentStepIndex: number): string {
  if (idx < currentStepIndex) return "bg-success-subtle-1 text-success-primary";
  if (idx === currentStepIndex) return "bg-accent-subtle-hover text-accent-primary";
  return "bg-layer-3 text-tertiary";
}

export function ImportWizard({ workspaceSlug, projectId, onClose }: Props) {
  const wizard = useImportWizard(workspaceSlug, projectId);

  const currentStepIndex = STEPS.findIndex((s) => s.key === wizard.step);
  const isFlowStep = wizard.step !== "progress" && wizard.step !== "results";

  return (
    <div className="rounded-lg border border-subtle bg-layer-1">
      {/* Header with step indicator */}
      <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
        {isFlowStep ? (
          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-caption-md-medium",
                    getStepIndicatorStyle(idx, currentStepIndex)
                  )}
                >
                  {idx < currentStepIndex ? "✓" : idx + 1}
                </div>
                <span
                  className={cn(
                    "hidden text-caption-md-regular sm:inline",
                    idx === currentStepIndex ? "text-primary text-caption-md-medium" : "text-tertiary"
                  )}
                >
                  {s.label}
                </span>
                {idx < STEPS.length - 1 && <div className="h-px w-6 bg-border-subtle" />}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-body-sm-medium text-primary">
            {wizard.step === "progress" ? "Importing..." : "Import Complete"}
          </span>
        )}
        <button onClick={onClose} className="flex size-7 items-center justify-center rounded hover:bg-layer-3">
          <X className="size-4 text-tertiary" />
        </button>
      </div>

      {/* Step content */}
      <div className="p-4">
        {wizard.step === "upload" && <StepUpload wizard={wizard} />}
        {wizard.step === "column_mapping" && <StepColumnMapping wizard={wizard} />}
        {wizard.step === "status_mapping" && <StepStatusMapping wizard={wizard} />}
        {wizard.step === "assignee_mapping" && <StepAssigneeMapping wizard={wizard} />}
        {wizard.step === "review" && <StepReview wizard={wizard} />}
        {wizard.step === "progress" && <ImportProgress wizard={wizard} />}
        {wizard.step === "results" && <ImportResults wizard={wizard} onClose={onClose} />}
      </div>
    </div>
  );
}
