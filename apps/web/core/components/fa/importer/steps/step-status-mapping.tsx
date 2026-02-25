// [FA-CUSTOM] Step 3: Map file statuses to project states

import { Button } from "@plane/propel/button";
import type { UseImportWizardReturn } from "../hooks/use-import-wizard";

type Props = {
  wizard: UseImportWizardReturn;
};

export function StepStatusMapping({ wizard }: Props) {
  const { uploadData, statusMapping, setStatusMapping } = wizard;
  if (!uploadData) return null;

  const statuses = uploadData.unique_statuses;
  const projectStates = uploadData.project_states;

  const handleChange = (statusValue: string, stateId: string) => {
    setStatusMapping((prev) => {
      const next = { ...prev };
      if (stateId === "") {
        delete next[statusValue];
      } else {
        next[statusValue] = stateId;
      }
      return next;
    });
  };

  // If no status column was mapped, skip this step
  if (!statuses || statuses.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-custom-text-300">
          No status column was detected. All imported issues will use the project&apos;s default status.
        </p>
        <div className="flex items-center justify-between border-t border-custom-border-200 pt-4">
          <Button variant="tertiary" size="sm" onClick={() => wizard.setStep("column_mapping")}>
            Back
          </Button>
          <Button variant="primary" size="sm" onClick={() => void wizard.saveAndAdvance("assignee_mapping")}>
            Next: Map Assignees
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-custom-text-300">
        Map each status value from your file to a project state. Unmapped statuses will use the default state.
      </p>

      <div className="overflow-hidden rounded border border-custom-border-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-custom-background-80">
              <th className="px-4 py-2 text-left font-medium text-custom-text-200">Status in File</th>
              <th className="px-4 py-2 text-left font-medium text-custom-text-200">Project State</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((statusValue) => (
              <tr key={statusValue} className="border-t border-custom-border-200">
                <td className="px-4 py-2 text-custom-text-100">{statusValue}</td>
                <td className="px-4 py-2">
                  <select
                    value={statusMapping[statusValue] || ""}
                    onChange={(e) => handleChange(statusValue, e.target.value)}
                    className="w-full rounded border border-custom-border-200 bg-custom-background-100 px-3 py-1.5 text-sm text-custom-text-100"
                  >
                    <option value="">— Default —</option>
                    {projectStates.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name} ({state.group})
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-custom-border-200 pt-4">
        <Button variant="tertiary" size="sm" onClick={() => wizard.setStep("column_mapping")}>
          Back
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={wizard.isLoading}
          loading={wizard.isLoading}
          onClick={() => void wizard.saveAndAdvance("assignee_mapping")}
        >
          Next: Map Assignees
        </Button>
      </div>
    </div>
  );
}
