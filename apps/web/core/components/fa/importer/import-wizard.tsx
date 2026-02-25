// [FA-CUSTOM] 5-step import wizard container

import { X } from "lucide-react";
import { cn } from "@plane/utils";
import { useImportWizard  } from "./hooks/use-import-wizard";
import type {ImportWizardStep} from "./hooks/use-import-wizard";
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

export function ImportWizard({ workspaceSlug, projectId, onClose }: Props) {
  const wizard = useImportWizard(workspaceSlug, projectId);

  const currentStepIndex = STEPS.findIndex((s) => s.key === wizard.step);
  const isFlowStep = wizard.step !== "progress" && wizard.step !== "results";

  return (
    <div className="rounded-lg border border-custom-border-200 bg-custom-background-100">
      {/* Header with step indicator */}
      <div className="flex items-center justify-between border-b border-custom-border-200 px-4 py-3">
        {isFlowStep ? (
          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-medium",
                    idx < currentStepIndex
                      ? "bg-green-500/20 text-green-600"
                      : idx === currentStepIndex
                        ? "bg-custom-primary-100/20 text-custom-primary-100"
                        : "bg-custom-background-80 text-custom-text-300"
                  )}
                >
                  {idx < currentStepIndex ? "✓" : idx + 1}
                </div>
                <span
                  className={cn(
                    "hidden text-xs sm:inline",
                    idx === currentStepIndex ? "text-custom-text-100 font-medium" : "text-custom-text-300"
                  )}
                >
                  {s.label}
                </span>
                {idx < STEPS.length - 1 && <div className="h-px w-6 bg-custom-border-200" />}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-sm font-medium text-custom-text-100">
            {wizard.step === "progress" ? "Importing..." : "Import Complete"}
          </span>
        )}
        <button
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded hover:bg-custom-background-80"
        >
          <X className="size-4 text-custom-text-300" />
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
